// ProfilePage — web port of the app's ProfileScreen: hero, quick actions,
// settings toggles (dark mode works via ThemeContext), navigation rows,
// message tone picker, and sign out.
import React, { useState } from 'react';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { useTheme, ACCENT_THEMES } from '../context/ThemeContext';
import { signOut } from '../services/authService';
import {
  MESSAGE_TONES, getMessageTone, setMessageTone, getMessageToneById,
} from '../services/notificationService';
import './ProfilePage.css';

const FALLBACK_ME = { id: 'me', name: 'You', initials: 'YO', g: 'E', handle: 'you' };

function Toggle({ on, onChange }) {
  return (
    <button
      type="button"
      className={`pf-toggle ${on ? 'on' : ''}`}
      onClick={() => onChange(!on)}
      aria-pressed={on}
    >
      <span className="pf-knob" />
    </button>
  );
}

function SetRow({ icon, color, label, detail, right, first, onClick }) {
  return (
    <div
      className={`pf-set-row ${first ? '' : 'pf-set-row-border'} ${onClick ? 'pf-set-row-click' : ''}`}
      onClick={onClick}
    >
      <span className="pf-set-ico" style={{ background: `linear-gradient(135deg, ${color[0]} 0%, ${color[1]} 100%)` }}>
        <Icon name={icon} size={18} color="white" />
      </span>
      <span className="pf-set-label">{label}</span>
      {detail ? <span className="pf-set-detail">{detail}</span> : null}
      {right}
    </div>
  );
}

export default function ProfilePage() {
  const { dark, setDark, accentId, accentTheme, setAccent } = useTheme();
  const { user, patchUser } = useAuth();
  const me = user || FALLBACK_ME;

  const [active, setActiveLocal] = useState(me.activeStatus ?? true);
  const [reads, setReadsLocal] = useState(me.readReceipts ?? true);
  const [tone, setTone] = useState(() => getMessageTone());
  const [tonePicker, setTonePicker] = useState(false);
  const [accentPicker, setAccentPicker] = useState(false);

  async function handleActiveToggle(val) {
    setActiveLocal(val);
    try { await patchUser({ activeStatus: val }); } catch {}
  }

  async function handleReadsToggle(val) {
    setReadsLocal(val);
    try { await patchUser({ readReceipts: val }); } catch {}
  }

  function handleSignOut() {
    if (window.confirm('Are you sure you want to sign out?')) {
      signOut().catch((e) => alert(e.message));
    }
  }

  const chooseTone = (id) => {
    setMessageTone(id);
    setTone(getMessageToneById(id));
    try { new Audio(getMessageToneById(id).file).play().catch(() => {}); } catch {}
  };

  return (
    <div className="profile-page">
      {/* hero */}
      <div className="pf-hero">
        <Avatar person={me} size={96} online={active} ring fontSize={34} />
        <div className="pf-hero-text">
          <h2 className="pf-name">{me.name}</h2>
          <p className="pf-handle">@{me.handle}</p>
        </div>
        <div className="pf-status">
          <span className="pf-status-dot" style={{ background: active ? 'var(--color-online)' : 'var(--color-text3)' }} />
          <span>{active ? 'Active now' : 'Offline'}</span>
        </div>
      </div>

      {/* quick actions */}
      <div className="pf-actions">
        {[['user', 'Profile'], ['archive', 'Archive'], ['star', 'Saved']].map(([ic, lbl]) => (
          <button key={lbl} className="pf-action-btn">
            <Icon name={ic} size={22} gradient />
            <span>{lbl}</span>
          </button>
        ))}
      </div>

      {/* settings: toggles */}
      <div className="pf-group">
        <SetRow first icon="moon" color={['#7c5cff', '#5b6bff']} label="Dark mode"
          right={<Toggle on={dark} onChange={setDark} />} />
        <SetRow icon="user" color={['#21c463', '#0ea5a5']} label="Active status"
          right={<Toggle on={active} onChange={handleActiveToggle} />} />
        <SetRow icon="check" color={['#0a7cff', '#23b5ff']} label="Read receipts"
          right={<Toggle on={reads} onChange={handleReadsToggle} />} />
      </div>

      {/* settings: navigation rows */}
      <div className="pf-group">
        <SetRow first icon="bell" color={['#ff8a65', '#ff5277']} label="Notifications" detail="On"
          right={<Icon name="chevron" size={18} color="var(--color-text3)" />} />
        <SetRow icon="bell" color={['#f7b733', '#fc4a1a']} label="Message tone" detail={tone?.label || ''}
          onClick={() => setTonePicker(true)}
          right={<Icon name="chevron" size={18} color="var(--color-text3)" />} />
        <SetRow icon="lock" color={['#9aa0b0', '#6a7080']} label="Privacy & safety"
          right={<Icon name="chevron" size={18} color="var(--color-text3)" />} />
        <SetRow icon="shield" color={['#0ea5a5', '#0a7cff']} label="Blocked accounts"
          right={<Icon name="chevron" size={18} color="var(--color-text3)" />} />
        <SetRow icon="palette" color={accentTheme.colors} label="Theme & color" detail={accentTheme.label}
          onClick={() => setAccentPicker(true)}
          right={<Icon name="chevron" size={18} color="var(--color-text3)" />} />
      </div>

      {/* sign out */}
      <button className="pf-signout" onClick={handleSignOut}>Sign out</button>
      <p className="pf-version">Halo · version 2.4.0</p>

      {/* Theme & color picker */}
      {accentPicker && (
        <div className="tone-overlay" onClick={() => setAccentPicker(false)}>
          <div className="tone-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tone-title">Theme & color</h3>
            {ACCENT_THEMES.map((t) => (
              <button key={t.id} className="tone-row" onClick={() => setAccent(t.id)}>
                <span className="accent-row-left">
                  <span
                    className="accent-swatch"
                    style={{ background: `linear-gradient(135deg, ${t.colors[0]} 0%, ${t.colors[1]} 100%)` }}
                  />
                  {t.label}
                </span>
                {accentId === t.id && <Icon name="check" size={20} color={t.colors[0]} />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message tone picker */}
      {tonePicker && (
        <div className="tone-overlay" onClick={() => setTonePicker(false)}>
          <div className="tone-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="tone-title">Message tone</h3>
            {MESSAGE_TONES.map((t) => (
              <button key={t.id} className="tone-row" onClick={() => chooseTone(t.id)}>
                <span>{t.label}</span>
                {tone?.id === t.id && <Icon name="check" size={20} color="#9b5cff" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
