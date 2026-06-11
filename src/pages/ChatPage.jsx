import React, { useState, useRef, useEffect, useCallback } from 'react';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';
import Bubble from '../components/Bubble';
import TypingDots from '../components/TypingDots';
import EmojiPicker from '../components/EmojiPicker';
import GifPicker from '../components/GifPicker';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useMessages } from '../hooks/useMessages';
import apiClient from '../services/apiClient';
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

    socket.on('typing', onTyping);
    socket.on('messages_seen', onMessagesSeen);

    return () => {
      socket.off('typing', onTyping);
      socket.off('messages_seen', onMessagesSeen);
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
    // Messenger collapses the quick actions to a chevron while typing.
    if (val && quickOpen) setQuickOpen(false);
    if (!val && !quickOpen) setQuickOpen(true);
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
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post('/api/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data.url;
      const optimisticId = `opt_${Date.now()}`;
      appendOptimistic({ id: optimisticId, from: 'me', kind: 'image', uri: url, time: 'now', pending: true });
      socket.emit('send_message', { conversationId: convId, kind: 'image', imageUrl: url });
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
    appendOptimistic({ id: optimisticId, from: 'me', kind: 'text', text: body, time: 'now', pending: true });
    setSeen(false);
    socket.emit('send_message', { conversationId: convId, kind: 'text', text: body });
    scrollToBottom();
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
              {typing ? 'typing…' : (p.online ? 'Active now' : (conversation?.sub || 'Active recently'))}
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
          />
        ))}
        {typing && (
          <div className="msg-row msg-in">
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
        {/* hidden file inputs */}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={handleFileChange} />

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
          <button className="composer-btn" title="More actions" onClick={() => setQuickOpen(true)}>
            <Icon name="chevron" size={24} />
          </button>
        )}

        <div className="comp-field">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
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

function MsgRow({ m, prev, next, curPerson, onReact }) {
  const mine = m.from === 'me';
  const cont = prev && prev.from === m.from && (m.who?.id === prev.who?.id);
  const groupStart = !prev || prev.from !== m.from || (m.who?.id !== prev.who?.id);
  const showAvatar = !mine && (!next || next.from !== m.from || next.who?.id !== m.who?.id);

  return (
    <div className={`msg-row ${mine ? 'msg-out' : 'msg-in'} ${groupStart ? 'group-start' : ''}`}>
      {!mine && (
        <div style={{ width: 26 }}>
          {showAvatar && <Avatar person={m.who || curPerson} size={26} />}
        </div>
      )}
      <div style={{ position: 'relative' }}>
        <Bubble
          m={m}
          cont={cont}
          onLongPress={(e) => onReact(m.id, e.nativeEvent)}
        />
        {m.react && (
          <div className={`react-chip ${mine ? 'react-mine' : 'react-theirs'}`}>
            {m.react}
          </div>
        )}
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

  const popWidth = 264;
  const popLeft = Math.max(10, Math.min(x - popWidth / 2, window.innerWidth - popWidth - 10));
  const popTop = Math.max(50, y - 70);

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
