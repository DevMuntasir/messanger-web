import React from 'react';
import './Bubble.css';

export default function Bubble({ m, cont, onLongPress }) {
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
      {m.kind === 'image' ? (
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
