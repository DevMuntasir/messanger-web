/* firebase-messaging-sw.js — receives data-only FCM pushes while the tab is
 * closed or backgrounded (same data-only payloads the backend sends to the
 * app) and renders the notification ourselves, mirroring the app's
 * background notification task. */

/* global importScripts, firebase, clients */
importScripts('https://www.gstatic.com/firebasejs/12.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.14.0/firebase-messaging-compat.js');

// Public web client config — safe to embed (same values shipped in the bundle).
firebase.initializeApp({
  apiKey: 'AIzaSyCH4O8Cp3Syxg0YRGFUavys44OkVfUVwOM',
  authDomain: 'mern-city.firebaseapp.com',
  projectId: 'mern-city',
  storageBucket: 'mern-city.appspot.com',
  messagingSenderId: '918332997063',
  appId: '1:918332997063:web:e563c43d4c84d6cc546de2',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  if (data.type !== 'new_message') return;

  const title = data.senderName || 'New message';
  return self.registration.showNotification(title, {
    body: data.preview || '',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: `conv_${data.conversationId || 'unknown'}`, // collapse per conversation
    data: { conversationId: data.conversationId || '' },
  });
});

// Tap on a notification: focus an open tab (and tell it which chat to open),
// or open a fresh one deep-linked to the conversation.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const convId = event.notification.data?.conversationId;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if (convId) client.postMessage({ type: 'open_chat', conversationId: convId });
          return;
        }
      }
      return clients.openWindow(convId ? `/?convId=${convId}` : '/');
    })
  );
});
