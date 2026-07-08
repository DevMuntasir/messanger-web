// BottomNav — web version of the app's bottom tab bar:
// Chats · Calls · People · Locker · You
import React from 'react';
import Icon from './Icon';
import './BottomNav.css';

const TABS = [
  { id: 'chats', label: 'Chats', icon: 'compose' },
  { id: 'calls', label: 'Calls', icon: 'phone' },
  { id: 'people', label: 'People', icon: 'user' },
  { id: 'locker', label: 'Locker', icon: 'lock' },
  { id: 'you', label: 'You', icon: 'user' },
];

export default function BottomNav({ active, onChange, unreadTotal = 0 }) {
  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`bn-tab ${active === tab.id ? 'active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          <span className="bn-icon">
            <Icon name={tab.icon} size={22} gradient={active === tab.id} />
            {tab.id === 'chats' && unreadTotal > 0 && (
              <span className="bn-badge">{unreadTotal}</span>
            )}
          </span>
          <span className="bn-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
