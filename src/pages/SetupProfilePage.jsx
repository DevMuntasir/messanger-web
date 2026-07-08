import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { registerProfile, updateMe } from '../services/authService';
import Icon from '../components/Icon';
import Avatar, { AV_GRADS } from '../components/Avatar';
import './SetupProfilePage.css';

const GRADIENT_KEYS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export default function SetupProfilePage() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [handle, setHandle] = useState('');
  const [g, setG] = useState('B');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSetup = async () => {
    if (!name.trim() || !handle.trim()) {
      setError('Name and handle are required');
      return;
    }
    if (handle.length < 3) {
      setError('Handle must be at least 3 characters');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const payload = {
        name: name.trim(),
        handle: handle.toLowerCase().trim().replace('@', ''),
        g,
      };
      // No backend user yet → register; user exists but incomplete → update.
      if (user) {
        await updateMe(payload);
      } else {
        await registerProfile(payload.name, payload.handle, payload.g);
      }
      await refreshUser();
    } catch (err) {
      setError(err.response?.data?.error || err.userMessage || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setup-profile-page">
      <div className="setup-container">
        <div className="setup-header">
          <h1>Complete Your Profile</h1>
          <p>Choose your look and get started</p>
        </div>

        {/* Avatar Color Picker */}
        <div className="setup-section">
          <label className="setup-label">Choose your color</label>
          <div className="color-grid">
            {GRADIENT_KEYS.map((key) => (
              <button
                key={key}
                className={`color-circle ${g === key ? 'selected' : ''}`}
                style={{
                  background: `linear-gradient(135deg, ${AV_GRADS[key][0]} 0%, ${AV_GRADS[key][1]} 100%)`,
                }}
                onClick={() => setG(key)}
              >
                {g === key && <Icon name="check" size={16} color="white" />}
              </button>
            ))}
          </div>
          <div className="avatar-preview">
            <Avatar person={{ name, initials: name.split(' ')[0][0] || 'U', g }} size={72} />
            <p>{name || 'Your Name'}</p>
          </div>
        </div>

        {/* Form */}
        <div className="setup-form">
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="setup-input"
          />
          <input
            type="text"
            placeholder="@handle (username)"
            value={handle}
            onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
            className="setup-input"
          />

          {error && <div className="setup-error">{error}</div>}

          <button
            onClick={handleSetup}
            disabled={loading || !name.trim() || !handle.trim()}
            className="setup-button"
          >
            {loading ? 'Setting up...' : 'Continue to Chat'}
          </button>
        </div>
      </div>
    </div>
  );
}
