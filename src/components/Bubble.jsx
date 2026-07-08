import React from 'react';
import './Bubble.css';

// RedGifs (and most modern GIF sources) serve silent mp4 loops,
// which <img> can't play — render those in a muted looping <video>.
const isVideoUri = (uri) => !!uri && /\.(mp4|webm|mov|m3u8)(\?|$)/i.test(uri);

export default function Bubble({ m, cont, onLongPress, onReply, onImagePress, onPress }) {
  const isMine = m.from === 'me';

  const handleContextMenu = (e) => {
    e.preventDefault();
    const menu = document.createElement('div');
    menu.className = 'bubble-context-menu';
    menu.innerHTML = `
      <button class="context-item" data-action="react">👍 React</button>
      <button class="context-item" data-action="reply">↩️ Reply</button>
    `;
    menu.style.position = 'fixed';
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';
    menu.style.zIndex = '10000';

    const handleMenuClick = (ev) => {
      const action = ev.target.dataset?.action;
      if (action === 'react') {
        onLongPress?.({
          nativeEvent: {
            pageX: e.clientX,
            pageY: e.clientY,
          },
        });
      } else if (action === 'reply') {
        onReply?.();
      }
      document.removeEventListener('click', handleMenuClick);
      menu.remove();
    };

    document.addEventListener('click', handleMenuClick);
    document.body.appendChild(menu);
  };

  return (
    <div
      className={`bubble ${isMine ? 'bubble-mine' : 'bubble-theirs'} ${cont ? 'bubble-cont' : 'bubble-start'}`}
      onClick={() => onPress?.()}
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
      {m.kind === 'video' ? (
        // A real video message: paused by default, native controls for play/sound/fullscreen.
        <video src={m.uri} className="bubble-video" controls playsInline preload="metadata" />
      ) : m.kind === 'image' && isVideoUri(m.uri) ? (
        <video src={m.uri} className="bubble-gif" autoPlay loop muted playsInline />
      ) : m.kind === 'image' ? (
        <img
          src={m.uri}
          alt="message"
          className="bubble-image"
          onClick={(e) => { e.stopPropagation(); onImagePress?.(m.uri); }}
        />
      ) : (
        <p className="bubble-text">{m.text}</p>
      )}
    </div>
  );
}
