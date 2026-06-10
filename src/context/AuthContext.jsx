import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import '../config/firebase';
import apiClient from '../services/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(undefined);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const res = await apiClient.get('/api/me');
          setUser(res.data);
        } catch (err) {
          // User doesn't exist in backend yet, try to create them
          try {
            const newUser = await apiClient.post('/api/me', {
              email: fbUser.email,
              name: fbUser.displayName || 'User',
              photoURL: fbUser.photoURL,
            });
            setUser(newUser.data);
          } catch {
            // If both fail, still keep firebaseUser so socket can try
            console.warn('Could not fetch or create user profile');
            setUser(null);
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/me');
      setUser(res.data);
      return res.data;
    } catch {
      return null;
    }
  }, []);

  const patchUser = useCallback(async (data) => {
    const res = await apiClient.patch('/api/me', data);
    setUser(res.data);
    return res.data;
  }, []);

  return (
    <AuthContext.Provider value={{ firebaseUser, user, setUser, loading, refreshUser, patchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
