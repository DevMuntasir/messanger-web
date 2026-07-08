import React, { useState, useRef, useEffect, useCallback } from 'react';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';
import Bubble from '../components/Bubble';
import TypingDots from '../components/TypingDots';
import EmojiPicker from '../components/EmojiPicker';
import GifPicker from '../components/GifPicker';
import StoriesSection from '../components/StoriesSection';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useMessages } from '../hooks/useMessages';
import apiClient from '../services/apiClient';
import { formatMessageTime, formatLastSeen } from '../utils/timeFormat';
import './ChatPage.css';

const REACTIONS = ['👍', '❤️', '😂', '😢', '😍', '🔥', '👌', '🎉'];
const FALLBACK_PERSON = { id: 'unknown', name: 'Unknown', initials: '??', g: 'A', online: false };

export default function ChatPage({ convId, onBack }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { msgs, appendOptimistic, applyReaction } = useMessages(convId);
  const [conversation, setConversation] = useState(null);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [seen, setSeen] = useState(false);
  const [reactAnchor, setReactAnchor] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [panel, setPanel] = useState(null);        // null | 'emoji' | 'gif' | 'attach'
  const [quickOpen, setQuickOpen] = useState(true); // left quick-action icons expanded
  const [replyTo, setReplyTo] = useState(null);    // message being replied to
  const [viewerUri, setViewerUri] = useState(null); // fullscreen image viewer

  const scrollRef = useRef(null);
  const typingTimer = useRef(null);
  const inputRef = useRef(null);
  const fileRef = useRef(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    apiClient.get(`/api/conversations/${convId}`)
      .then(res => setConversation(res.data))
      .catch(() => {});

    apiClient.patch(`/api/conversations/${convId}/seen`).catch(() => {});
  }, [convId]);

  useEffect(() => {
    scrollToBottom();
  }, [msgs]);

  useEffect(() => {
    if (!socket) return;

    function onTyping({ userId, isTyping }) {
      if (userId !== user?.id) setTyping(isTyping);
    }

    function onMessagesSeen({ seenBy }) {
      if (seenBy !== user?.id) setSeen(true);
    }

    // Keep the header's online / last-seen state live while the chat is open.
    function onPresenceUpdate({ userId, online, lastSeen }) {
      setConversation(prev => {
        if (!prev || prev.person?.id !== userId) return prev;
        return {
          ...prev,
          person: { ...prev.person, online, lastSeen: lastSeen || prev.person.lastSeen },
        };
      });
    }

    socket.on('typing', onTyping);
    socket.on('messages_seen', onMessagesSeen);
    socket.on('presence_update', onPresenceUpdate);

    return () => {
      socket.off('typing', onTyping);
      socket.off('messages_seen', onMessagesSeen);
      socket.off('presence_update', onPresenceUpdate);
    };
  }, [socket, user?.id]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'auto' });
    }, 0);
  };

  const emitTypingStop = useCallback(() => {
    if (socket && convId) socket.emit('typing_stop', { conversationId: convId });
  }, [socket, convId]);

  const handleTextChange = (val) => {
    setText(val);
    if (!socket || !convId) return;
    socket.emit('typing_start', { conversationId: convId });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(emitTypingStop, 2000);
  };

  const togglePanel = (name) => {
    setPanel(prev => (prev === name ? null : name));
  };

  const insertEmoji = (emoji) => {
    const el = inputRef.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    setText(text.slice(0, start) + emoji + text.slice(end));
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const sendGif = (url) => {
    if (!socket || !url) return;
    const optimisticId = `opt_${Date.now()}`;
    appendOptimistic({ id: optimisticId, from: 'me', kind: 'image', uri: url, time: 'now', pending: true });
    socket.emit('send_message', { conversationId: convId, kind: 'image', imageUrl: url });
    setPanel(null);
    scrollToBottom();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !socket) return;
    const isVideo = (file.type || '').startsWith('video/');
    const kind = isVideo ? 'video' : 'image';
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post('/api/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: isVideo ? 60000 : 15000,
      });
      const url = res.data.url;
      const optimisticId = `opt_${Date.now()}`;
      appendOptimistic({ id: optimisticId, from: 'me', kind, uri: url, time: 'now', pending: true });
      socket.emit('send_message', { conversationId: convId, kind, imageUrl: url });
      scrollToBottom();
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const send = () => {
    const body = text.trim();
    if (!body || !socket) return;
    setText('');
    setQuickOpen(true);
    emitTypingStop();
    const optimisticId = `opt_${Date.now()}`;
    const msgPayload = { id: optimisticId, from: 'me', kind: 'text', text: body, time: 'now', pending: true };
    if (replyTo) msgPayload.replyTo = replyTo.id;
    appendOptimistic(msgPayload);
    setSeen(false);
    socket.emit('send_message', { conversationId: convId, kind: 'text', text: body, replyTo: replyTo?.id });
    setReplyTo(null);
    scrollToBottom();
  };

  const handleReply = (msg) => {
    setReplyTo(msg);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const sendLike = () => {
    if (!socket) return;
    const optimisticId = `opt_${Date.now()}`;
    appendOptimistic({ id: optimisticId, from: 'me', kind: 'text', text: '👍', time: 'now', pending: true });
    socket.emit('send_message', { conversationId: convId, kind: 'text', text: '👍' });
    scrollToBottom();
  };

  const openReact = (id, e) => {
    setReactAnchor({
      id,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleApplyReact = (emoji) => {
    const id = reactAnchor.id;
    setReactAnchor(null);
    applyReaction(id, emoji);
  };

  const p = conversation?.person || FALLBACK_PERSON;
  const lastMine = [...msgs].reverse().find(m => m.from === 'me' && !m.pending);

  return (
    <div className="chat-page">
      {/* Stories Section */}
      <StoriesSection friendsList={conversation?.person ? [conversation.person] : []} />

      {/* Header */}
      <div className="chat-header">
        <button className="back-btn" onClick={onBack}>
          <Icon name="back" size={24} />
        </button>
        <div className="chat-who">
          <Avatar person={p} size={38} online={p.online} />
          <div>
            <p className="chat-name">{p.name}</p>
            <p className="chat-sub">
              {typing ? 'typing…' : (p.online ? 'Active now' : formatLastSeen(p.lastSeen))}
            </p>
          </div>
        </div>
        <div className="chat-actions">
          <button className="action-btn" title="Call">
            <Icon name="phone" size={22} gradient />
          </button>
          <button className="action-btn" title="Video call">
            <Icon name="video" size={22} gradient />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-thread">
        {msgs.map((m, i) => (
          <MsgRow
            key={m.id}
            m={m}
            prev={msgs[i - 1]}
            next={msgs[i + 1]}
            curPerson={p}
            onReact={openReact}
            onReply={handleReply}
            onImagePress={setViewerUri}
            allMsgs={msgs}
          />
        ))}
        {typing && (
          <div className="msg-row msg-in typing-row">
            <Avatar person={p} size={26} />
            <TypingDots />
          </div>
        )}
        {!typing && lastMine && (
          <div className="seen-line">
            {seen ? (
              <>
                <Avatar person={p} size={15} />
                <span className="seen-text">Seen</span>
              </>
            ) : (
              <span className="seen-text">Delivered</span>
            )}
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Composer */}
      <div className="chat-composer">
        {replyTo && (
          <div className="quote-box">
            <button className="quote-dismiss" onClick={() => setReplyTo(null)}>✕</button>
            <div className="quote-content">
              <div className="quote-label">
                Replying to {replyTo.from === 'me' ? 'yourself' : replyTo.who?.name || 'them'}
              </div>
              <div className="quote-text">
                {replyTo.kind === 'text' ? replyTo.text
                  : replyTo.kind === 'image' ? '📷 Image'
                  : replyTo.kind === 'video' ? '🎥 Video'
                  : '🎙️ Voice'}
              </div>
            </div>
          </div>
        )}
        <div className="composer-content">
          {/* hidden file inputs */}
          <input ref={fileRef} type="file" accept="image/*,video/*" hidden onChange={handleFileChange} />
          <input ref={cameraRef} type="file" accept="image/*,video/*" capture="environment" hidden onChange={handleFileChange} />

          {quickOpen ? (
          <>
            <button className="composer-btn" title="Add attachment" onClick={() => togglePanel('attach')}>
              <Icon name="plus" size={24} />
            </button>
            <button className="composer-btn" title="Camera" disabled={uploading}
              onClick={() => cameraRef.current?.click()}>
              <Icon name="camera" size={22} gradient />
            </button>
            <button className="composer-btn" title="Image" disabled={uploading}
              onClick={() => fileRef.current?.click()}>
              <Icon name="image" size={22} gradient />
            </button>
            <button className="composer-btn" title="GIF" onClick={() => togglePanel('gif')}>
              <Icon name="gif" size={24} />
            </button>
          </>
        ) : (
          <button className="composer-btn" title="More actions"
            onClick={() => { setQuickOpen(true); inputRef.current?.blur(); }}>
            <Icon name="chevron" size={24} />
          </button>
        )}

        <div className="comp-field">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (panel) setPanel(null);
              if (quickOpen) setQuickOpen(false);
            }}
            placeholder="Message…"
            className="comp-input"
            rows="1"
            style={{ resize: 'none' }}
          />
          <button className={`composer-btn ${panel === 'emoji' ? 'active' : ''}`} title="Emoji"
            onClick={() => togglePanel('emoji')}>
            <Icon name="emoji" size={22} />
          </button>
        </div>
        {uploading ? (
          <div className="composer-spinner" title="Uploading…">⏳</div>
        ) : text.trim() ? (
          <button className="send-btn" onClick={send}>
            <Icon name="send" size={20} color="white" />
          </button>
        ) : (
          <button className="like-btn" onClick={sendLike}>
            👍
          </button>
          )}
        </div>

        {/* popover panels */}
        {panel === 'emoji' && (
          <EmojiPicker onPick={insertEmoji} onClose={() => setPanel(null)} />
        )}
        {panel === 'gif' && (
          <GifPicker onSend={sendGif} onClose={() => setPanel(null)} />
        )}
        {panel === 'attach' && (
          <>
            <div className="panel-overlay" onClick={() => setPanel(null)} />
            <div className="attach-menu">
            <button onClick={() => { setPanel(null); cameraRef.current?.click(); }}>
              <span className="attach-icon"><Icon name="camera" size={20} gradient /></span>
              Camera
            </button>
            <button onClick={() => { setPanel(null); fileRef.current?.click(); }}>
              <span className="attach-icon"><Icon name="image" size={20} gradient /></span>
              Photo library
            </button>
            <button onClick={() => setPanel('gif')}>
              <span className="attach-icon"><Icon name="gif" size={20} /></span>
              GIF
            </button>
            </div>
          </>
        )}
      </div>

      {/* fullscreen image viewer */}
      {viewerUri && (
        <div className="viewer-overlay" onClick={() => setViewerUri(null)}>
          <button className="viewer-close" onClick={() => setViewerUri(null)}>✕</button>
          <img src={viewerUri} alt="" className="viewer-image" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* Reaction Picker */}
      {reactAnchor && (
        <ReactionPicker
          reactions={REACTIONS}
          x={reactAnchor.x}
          y={reactAnchor.y}
          onReact={handleApplyReact}
          onClose={() => setReactAnchor(null)}
        />
      )}
    </div>
  );
}

const SWIPE_TRIGGER = 56;   // px of horizontal drag that arms the reply
const SWIPE_MAX = 84;       // bubble travel is clamped here

function MsgRow({ m, prev, next, curPerson, onReact, onReply, onImagePress, allMsgs }) {
  const { user } = useAuth();
  const [showTime, setShowTime] = useState(false);
  const mine = m.from === 'me';
  const timeLabel = formatMessageTime(m);
  const cont = prev && prev.from === m.from && (m.who?.id === prev.who?.id);
  const groupStart = !prev || prev.from !== m.from || (m.who?.id !== prev.who?.id);
  const showAvatar = !mine && (!next || next.from !== m.from || next.who?.id !== m.who?.id);

  // Quoted message: prefer the loaded copy, fall back to the server snapshot
  // (replyPreview) when the original is outside the loaded window.
  const replyMsg = m.replyTo
    ? (allMsgs?.find(msg => msg.id === m.replyTo)
      || (m.replyPreview ? {
        kind: m.replyPreview.kind,
        text: m.replyPreview.text,
        from: m.replyPreview.senderId === user?.id ? 'me' : 'them',
        who: curPerson,
      } : null))
    : null;

  const handleReply = () => {
    onReply?.(m);
  };

  // Swipe-to-reply (Messenger style, touch devices): drag the bubble toward
  // the center, a reply arrow fades in behind it; passing the threshold arms
  // the reply.
  const dir = mine ? -1 : 1; // outgoing swipes left, incoming swipes right
  const [swipeX, setSwipeX] = useState(0);
  const touchRef = useRef({ startX: 0, startY: 0, engaged: false, crossed: false, dist: 0 });

  const onTouchStart = (e) => {
    const t = e.touches[0];
    touchRef.current = { startX: t.clientX, startY: t.clientY, engaged: false, crossed: false, dist: 0 };
  };

  const onTouchMove = (e) => {
    const t = e.touches[0];
    const s = touchRef.current;
    const dx = t.clientX - s.startX;
    const dy = t.clientY - s.startY;
    if (!s.engaged) {
      if (dx * dir > 14 && Math.abs(dx) > Math.abs(dy) * 1.6) s.engaged = true;
      else return;
    }
    const dist = Math.min(Math.max(dx * dir, 0), SWIPE_MAX);
    s.dist = dist;
    setSwipeX(dist * dir);
    if (dist > SWIPE_TRIGGER && !s.crossed) {
      s.crossed = true;
      try { navigator.vibrate?.(8); } catch {}
    } else if (dist <= SWIPE_TRIGGER) {
      s.crossed = false;
    }
  };

  const onTouchEnd = () => {
    if (touchRef.current.dist > SWIPE_TRIGGER) handleReply();
    touchRef.current.engaged = false;
    setSwipeX(0); // CSS transition springs the bubble back
  };

  const swipeProgress = Math.min(Math.abs(swipeX) / SWIPE_TRIGGER, 1);

  // Messenger-style reply: "You replied to X" label, then a dimmed quote pill
  // that the actual bubble overlaps from below.
  let replyEl = null;
  if (replyMsg) {
    const replierName = mine ? 'You' : (m.who?.name?.split(' ')[0] || curPerson?.name?.split(' ')[0] || 'They');
    const targetName = replyMsg.from === 'me'
      ? (mine ? 'yourself' : 'you')
      : (replyMsg.who?.name?.split(' ')[0] || 'them');
    const quoteText = replyMsg.kind === 'text' ? replyMsg.text
      : replyMsg.kind === 'image' ? '📷 Photo'
      : replyMsg.kind === 'video' ? '🎥 Video'
      : replyMsg.kind === 'voice' ? '🎙️ Voice message'
      : 'Message';
    replyEl = (
      <>
        <div className="reply-label-row">
          <span className="reply-arrow">↩</span>
          <span className="reply-label">{replierName} replied to {targetName}</span>
        </div>
        <div className="reply-pill">{quoteText}</div>
      </>
    );
  }

  return (
    <div
      className={`msg-row ${mine ? 'msg-out' : 'msg-in'} ${groupStart ? 'group-start' : ''}`}
      style={{ position: 'relative' }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      {showTime && timeLabel ? (
        <span className="time-label">{timeLabel}</span>
      ) : null}
      <div
        className="swipe-icon-wrap"
        style={{
          [mine ? 'right' : 'left']: mine ? 2 : 34,
          opacity: swipeProgress,
          transform: `scale(${0.4 + swipeProgress * 0.6})`,
        }}
      >
        <div className="swipe-icon">↩</div>
      </div>
      <div
        className="swipe-track"
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: swipeX === 0 ? 'transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1.2)' : 'none',
        }}
      >
        {!mine && (
          <div style={{ width: 26 }}>
            {showAvatar && <Avatar person={m.who || curPerson} size={26} />}
          </div>
        )}
        <div style={{ position: 'relative' }} className={mine ? 'msg-col-out' : 'msg-col-in'}>
          {replyEl}
          <Bubble
            m={m}
            cont={cont}
            onLongPress={(e) => onReact(m.id, e.nativeEvent)}
            onPress={() => setShowTime(s => !s)}
            onReply={handleReply}
            onImagePress={onImagePress}
          />
          {m.react && (
            <div className={`react-chip ${mine ? 'react-mine' : 'react-theirs'}`}>
              {m.react}
            </div>
          )}
          {m.pending && mine && (
            <div className="msg-status">Sending…</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReactionPicker({ reactions, x, y, onReact, onClose }) {
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const popWidth = 300;
  const popLeft = Math.max(10, Math.min(x - popWidth / 2, window.innerWidth - popWidth - 10));
  const popTop = Math.max(50, Math.min(y - 80, window.innerHeight - 100));

  return (
    <>
      <div className="react-overlay" onClick={onClose} />
      <div
        ref={pickerRef}
        className="react-pop"
        style={{ left: `${popLeft}px`, top: `${popTop}px` }}
      >
        {reactions.map((r) => (
          <button
            key={r}
            className="react-btn"
            onClick={() => onReact(r)}
            title={r}
          >
            {r}
          </button>
        ))}
      </div>
    </>
  );
}
