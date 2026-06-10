import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'https://messenger-atvk.onrender.com';

let socket = null;

export function connect(getToken) {
  if (socket?.connected) return socket;

  socket = io(API_URL, {
    auth: (cb) => {
      Promise.resolve(getToken())
        .then((token) => cb({ token }))
        .catch(() => cb({ token: null }));
    },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', {
      message: error.message,
      data: error.data,
      type: error.type,
    });
  });

  socket.on('disconnect', (reason) => {
    console.warn('Socket disconnected:', reason);
    if (reason === 'io server disconnect') {
      console.error('Server disconnected the socket. Check if user is registered.');
    }
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected successfully');
  });

  return socket;
}

export function disconnect() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket() {
  return socket;
}
