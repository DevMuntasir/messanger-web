// EmojiPicker.jsx — Messenger-style emoji popover: category tabs, paged
// grids, and a "recents" row persisted in localStorage.
import React, { useState, useEffect, useRef, useCallback } from 'react';
import './EmojiPicker.css';

const RECENT_KEY = 'halo_recent_emojis';
const MAX_RECENT = 24;

const CATEGORIES = [
  {
    key: 'smileys', icon: '😀', label: 'Smileys',
    data: ['😀','😃','😄','😁','😆','😅','😂','🤣','🥲','☺️','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥸','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😴','🤤','😪','😮','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👻','💀','👽','🤖','🎃','😺','😸','😹','😻','😼','🙀','😿'],
  },
  {
    key: 'gestures', icon: '👍', label: 'Gestures',
    data: ['👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦵','🦶','👂','👃','🧠','👀','👁️','👅','👄'],
  },
  {
    key: 'hearts', icon: '❤️', label: 'Hearts',
    data: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','♥️','😻','💋','💌','💍','💐','🌹','🌷','🥀'],
  },
  {
    key: 'animals', icon: '🐻', label: 'Animals & nature',
    data: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦄','🐴','🐝','🦋','🐌','🐢','🐍','🦖','🐙','🦀','🐠','🐬','🐳','🦈','🌵','🎄','🌲','🍀','🌸','🌺','🌻','🌈','⭐','🌟','✨','⚡','🔥','💧','🌊','🌙','☀️','☁️','❄️','⛄'],
  },
  {
    key: 'food', icon: '🍕', label: 'Food & drink',
    data: ['🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🥑','🌽','🥕','🍞','🥐','🥨','🧀','🍳','🥞','🧇','🥓','🍗','🍖','🌭','🍔','🍟','🍕','🌮','🌯','🥗','🍝','🍜','🍣','🍤','🍙','🍚','🍩','🍪','🎂','🍰','🧁','🍫','🍬','🍭','🍯','☕','🍵','🥛','🥤','🧃','🍺','🍻','🥂','🍷'],
  },
  {
    key: 'activities', icon: '⚽', label: 'Activities',
    data: ['⚽','🏀','🏈','⚾','🎾','🏐','🏉','🎱','🏓','🏸','🥊','🥋','⛳','🏹','🎣','🛹','🛼','🎿','🏂','🏆','🥇','🥈','🥉','🏅','🎖️','🎗️','🎫','🎟️','🎪','🎭','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🎷','🎺','🎸','🎻','🎲','♟️','🎯','🎳','🎮','🕹️','🧩'],
  },
  {
    key: 'travel', icon: '🚗', label: 'Travel & places',
    data: ['🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🚚','🚜','🛵','🏍️','🚲','🛴','🚂','🚆','✈️','🛫','🚀','🛸','🚁','⛵','🚤','🛳️','⚓','🗺️','🗽','🗼','🏰','🏯','🎡','🎢','🎠','⛲','⛱️','🏖️','🏝️','⛰️','🏔️','🗻','🏕️','🏠','🏡','🏢','🏥','🏦','🏨','🏪','🏫','⛪','🕌','🌁','🌃','🌆','🌇','🌉'],
  },
  {
    key: 'objects', icon: '💡', label: 'Objects',
    data: ['⌚','📱','💻','⌨️','🖥️','🖨️','🖱️','💽','💾','💿','📷','📸','📹','🎥','📞','☎️','📺','📻','🎙️','⏰','⌛','📡','🔋','🔌','💡','🔦','🕯️','💸','💵','💰','💳','💎','⚖️','🔧','🔨','⚙️','🔫','💣','🔪','🛡️','🚬','⚰️','🔮','💈','🔭','🔬','💊','💉','🌡️','🚽','🛁','🔑','🚪','🛋️','🛏️','🧸','🎁','🎈','🎀','🎉','🎊'],
  },
  {
    key: 'symbols', icon: '💯', label: 'Symbols',
    data: ['💯','💢','💥','💫','💦','💨','💬','💭','💤','✅','❌','❓','❗','‼️','⁉️','💲','♻️','⚜️','🔱','📛','🔰','⭕','🛑','⛔','📵','🚭','❎','🆗','🆒','🆕','🆓','🆙','🆖','🎵','🎶','➕','➖','➗','✖️','♾️','⚠️','🚸','🔔','🔕','➡️','⬅️','⬆️','⬇️','↗️','↘️','🔄','🔃','🔝','🔚','🔙','🔛','🔜'],
  },
];

function loadRecent() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function EmojiPicker({ onPick, onClose }) {
  const [cat, setCat] = useState('smileys');
  const [recent, setRecent] = useState(loadRecent);
  const rootRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) onClose?.();
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [onClose]);

  const pick = useCallback((emoji) => {
    onPick(emoji);
    setRecent(prev => {
      const next = [emoji, ...prev.filter(e => e !== emoji)].slice(0, MAX_RECENT);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [onPick]);

  const tabs = recent.length
    ? [{ key: 'recent', icon: '🕘', label: 'Recent', data: recent }, ...CATEGORIES]
    : CATEGORIES;
  const active = tabs.find(t => t.key === cat) || tabs[0];

  return (
    <div className="emoji-panel" ref={rootRef}>
      <div className="emoji-grid">
        {active.data.map((e, i) => (
          <button key={`${active.key}_${i}`} className="emoji-cell" onClick={() => pick(e)}>
            {e}
          </button>
        ))}
      </div>
      <div className="emoji-tabs">
        {tabs.map(t => (
          <button
            key={t.key}
            className={`emoji-tab ${cat === t.key ? 'active' : ''}`}
            onClick={() => setCat(t.key)}
            title={t.label}
          >
            {t.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
