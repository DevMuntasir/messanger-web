// notificationService — web counterpart of the app's notification service.
// Message tone lives in localStorage; FCM web push mirrors the app's flow:
// ask permission, fetch the FCM token, and save it on our user so the
// backend can push to this browser.
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { app } from '../config/firebase';
import apiClient from './apiClient';

const MESSAGE_TONE_KEY = 'message_notification_tone';

export const MESSAGE_TONES = [
  { id: 'default', label: 'Default', file: '/sounds/tone_chime.wav' },
  { id: 'chime', label: 'Chime', file: '/sounds/tone_chime.wav' },
  { id: 'marimba', label: 'Marimba', file: '/sounds/tone_marimba.wav' },
];
const DEFAULT_TONE_ID = 'default';

export function getMessageToneById(id) {
  return MESSAGE_TONES.find((t) => t.id === id) || MESSAGE_TONES[0];
}

export function getMessageTone() {
  let id = null;
  try { id = localStorage.getItem(MESSAGE_TONE_KEY); } catch {}
  return getMessageToneById(id || DEFAULT_TONE_ID);
}

export function setMessageTone(id) {
  try { localStorage.setItem(MESSAGE_TONE_KEY, id); } catch {}
}

// Plays the user's selected message tone for a message received while the
// tab is open. Browsers may block audio before the first user interaction —
// that failure is silently ignored.
export function playIncomingMessageSound() {
  try {
    const tone = getMessageTone();
    const audio = new Audio(tone.file);
    audio.play().catch(() => {});
  } catch {}
}

// ---------------------------------------------------------------------------
// FCM web push — same design as the app: the backend sends data-only pushes,
// the service worker (public/firebase-messaging-sw.js) renders notifications
// when the tab is closed/backgrounded.

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// Ask permission, fetch the FCM registration token, and save it on our user
// so the backend can push to this browser. Call after login.
export async function registerPushToken() {
  try {
    if (!(await isSupported())) return null; // e.g. Safari without push support
    if (!VAPID_KEY) {
      console.warn('Push: VITE_FIREBASE_VAPID_KEY is not set — web push disabled.');
      return null;
    }

    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }
    if (permission !== 'granted') return null;

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      await apiClient.patch('/api/auth/me', { pushToken: token });
    }
    return token;
  } catch (err) {
    console.warn('Push registration failed:', err);
    return null;
  }
}

// Foreground pushes: the socket already renders the message live and plays
// the tone, so a visible notification is only useful when the tab is hidden.
export async function listenForegroundMessages() {
  try {
    if (!(await isSupported())) return () => {};
    const messaging = getMessaging(app);
    return onMessage(messaging, (payload) => {
      const data = payload.data || {};
      if (data.type !== 'new_message' || !document.hidden) return;
      navigator.serviceWorker?.ready.then((registration) => {
        registration.showNotification(data.senderName || 'New message', {
          body: data.preview || '',
          icon: '/favicon.svg',
          tag: `conv_${data.conversationId || 'unknown'}`,
          data: { conversationId: data.conversationId || '' },
        });
      });
    });
  } catch {
    return () => {};
  }
}
