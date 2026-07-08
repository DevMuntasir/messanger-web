// LoginPage — same auth flow as the app: Firebase email/password sign-in,
// and a sign-up form that collects name, @handle, avatar color.
import React, { useState } from 'react';
import '../config/firebase';
import Icon from '../components/Icon';
import { AV_GRADS } from '../components/Avatar';
import { signIn, signUp } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

const GRADIENT_KEYS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export default function LoginPage() {
  const { setUser } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [g, setG] = useState('B');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isRegister = mode === 'register';

  const switchMode = (m) => {
    setMode(m);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    if (isRegister) {
      if (!name.trim() || !handle.trim()) return;
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
    }
    setLoading(true);
    setError('');
    try {
      const user = isRegister
        ? await signUp(email.trim(), password, name.trim(), handle.trim().replace('@', ''), g)
        : await signIn(email.trim(), password);
      setUser(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo-ring">H</div>
          <h1>{isRegister ? 'Create account' : 'Welcome back'}</h1>
          <p>{isRegister ? 'Join Halo Messenger' : 'Sign in to continue'}</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <label className="login-label">Choose your color</label>
              <div className="color-row">
                {GRADIENT_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    className={`color-circle ${g === key ? 'selected' : ''}`}
                    style={{ background: `linear-gradient(135deg, ${AV_GRADS[key][0]} 0%, ${AV_GRADS[key][1]} 100%)` }}
                    onClick={() => setG(key)}
                  >
                    {g === key && <Icon name="check" size={16} color="white" />}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="login-input"
              />
              <input
                type="text"
                placeholder="@handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                className="login-input"
                autoCapitalize="none"
              />
            </>
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input"
            autoComplete="email"
          />
          <input
            type="password"
            placeholder={isRegister ? 'Password (min 6 chars)' : 'Password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            autoComplete={isRegister ? 'new-password' : 'current-password'}
          />

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" />
                {isRegister ? 'Creating account…' : 'Signing in…'}
              </>
            ) : (
              isRegister ? 'Create Account' : 'Sign In'
            )}
          </button>
        </form>

        <div className="login-footer">
          {isRegister ? (
            <p>Already have an account?{' '}
              <button className="login-link" onClick={() => switchMode('login')}>Sign in</button>
            </p>
          ) : (
            <p>Don't have an account?{' '}
              <button className="login-link" onClick={() => switchMode('register')}>Sign up</button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
