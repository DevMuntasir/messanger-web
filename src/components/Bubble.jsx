import React from 'react';
import './Bubble.css';

// RedGifs (and most modern GIF sources) serve silent mp4 loops,
// which <img> can't play — render those in a muted looping <video>.
const isVideoUri = (uri) => !!uri && /\.(mp4|webm|mov|m3u8)(\?|$)/i.test(uri);

export default function Bubble({ m, cont, onLongPress, onReply }) {
  const isMine = m.from === 'me';

  const handleContextMenu = (e) => {
    e.preventDefault();
    onLongPress?.({
      nativeEvent: {
        pageX: e.clientX,
        pageY: e.clientY,
      },
    });
  };

  return (
    <div
      className={`bubble ${isMine ? 'bubble-mine' : 'bubble-theirs'} ${cont ? 'bubble-cont' : 'bubble-start'}`}
      onContextMenu={handleContextMenu}
      onMouseDown={(e) => {
        if (e.button === 2) return;
        const timer = setTimeout(() => {
          onLongPress?.({
            nativeEvent: {
              pageX: e.clientX,
              pageY: e.clientY,
            },
          });
        }, 500);
        const cleanup = () => clearTimeout(timer);
        e.currentTarget.addEventListener('mouseup', cleanup, { once: true });
        e.currentTarget.addEventListener('mouseleave', cleanup, { once: true });
      }}
    >
      {m.kind === 'image' && isVideoUri(m.uri) ? (
        <video src={m.uri} className="bubble-gif" autoPlay loop muted playsInline />
      ) : m.kind === 'image' ? (
        <img src={m.uri} alt="message" className="bubble-image" />
      ) : (
        <p className="bubble-text">{m.text}</p>
      )}
      <span className="bubble-time">{formatTime(m.time)}</span>
      {m.pending && <span className="bubble-pending">⏱</span>}
    </div>
  );
}

function formatTime(time) {
  if (time === 'now') return 'now';
  const date = new Date(time);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}
