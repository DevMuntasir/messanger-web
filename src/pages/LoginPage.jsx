import React, { useState } from 'react';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import '../config/firebase';
import Icon from '../components/Icon';
import './LoginPage.css';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path d="M24 4C13.06 4 4 13.06 4 24s9.06 20 20 20 20-9.06 20-20S34.94 4 24 4zm0 36c-8.84 0-16-7.16-16-16s7.16-16 16-16 16 7.16 16 16-7.16 16-16 16zm-4-12h8v-4h-8v4zm4-12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" fill="url(#gradient)" />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#b66bff" />
                  <stop offset="100%" stopColor="#7c5cff" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1>Messenger</h1>
          <p>Chat with anyone, anywhere</p>
        </div>

        <button
          className="login-button google-button"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner" />
              Signing in...
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.545,10.852v3.608h5.838c-0.164,1.305-0.955,2.41-2.049,3.149v2.053h3.315 c1.886-1.733,2.973-4.331,2.973-7.378c0-0.714-0.109-1.405-0.293-2.052H12.545z" />
                <path d="M19.334,15.662c-1.02,0.768-2.368,1.226-3.814,1.226c-2.91,0-5.359-2.247-5.359-5.033 c0-0.619,0.124-1.205,0.337-1.763H5.002v2.121C5.667,14.806,8.752,19,12.52,19 c2.464,0,4.552-0.811,6.056-2.169L19.334,15.662z" />
                <path d="M12.52,9.448c1.99,0,3.782,0.704,5.162,1.876l3.853-3.787 C16.904,5.174,14.947,4,12.52,4C8.752,4,5.667,8.194,5.002,13.346l3.371,2.619 C9.161,11.695,10.712,9.448,12.52,9.448z" />
              </svg>
              Sign in with Google
            </>
          )}
        </button>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <div className="login-footer">
          <p>Your chats are encrypted and secure</p>
        </div>
      </div>
    </div>
  );
}
