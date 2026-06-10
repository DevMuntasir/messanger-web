import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/apiClient';
import Icon from '../components/Icon';
import Avatar from '../components/Avatar';
import './SetupProfilePage.css';

const GRADIENT_KEYS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const GRADIENTS = {
  A: ['#667eea', '#764ba2'],
  B: ['#f093fb', '#f5576c'],
  C: ['#4facfe', '#00f2fe'],
  D: ['#43e97b', '#38f9d7'],
  E: ['#fa709a', '#fee140'],
  F: ['#30cfd0', '#330867'],
  G: ['#a8edea', '#fed6e3'],
  H: ['#ff9a56', '#ff6a88'],
};

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
      await apiClient.patch('/api/me', {
        name: name.trim(),
        handle: handle.toLowerCase().trim().replace('@', ''),
        g,
      });
      await refreshUser();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save profile');
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
                  background: `linear-gradient(135deg, ${GRADIENTS[key][0]} 0%, ${GRADIENTS[key][1]} 100%)`,
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
