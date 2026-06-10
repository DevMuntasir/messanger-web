import React, { createContext, useContext, useEffect, useState } from 'react';
import { connect, disconnect } from '../services/socketService';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { firebaseUser } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!firebaseUser) {
      disconnect();
      setSocket(null);
      return;
    }

    const s = connect(() => firebaseUser.getIdToken());
    setSocket(s);

    return () => {
      disconnect();
      setSocket(null);
    };
  }, [firebaseUser]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}
