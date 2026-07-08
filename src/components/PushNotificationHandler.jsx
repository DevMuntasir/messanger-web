// Invisible component mounted while the user is logged in — web counterpart
// of the app's PushNotificationHandler. Owns token registration,
// notification-tap navigation, and foreground push handling.
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { registerPushToken, listenForegroundMessages } from '../services/notificationService';

export default function PushNotificationHandler({ onOpenChat }) {
  const { user } = useAuth();

  // Register the FCM token once we know who the user is.
  useEffect(() => {
    if (user) registerPushToken();
  }, [user?.id]);

  // Foreground pushes → notification only when the tab is hidden.
  useEffect(() => {
    let unsub = () => {};
    listenForegroundMessages().then((u) => { unsub = u || (() => {}); });
    return () => unsub();
  }, []);

  useEffect(() => {
    // Tap on a notification while a tab was already open: the service worker
    // focuses us and posts which conversation to open.
    const onSwMessage = (event) => {
      if (event.data?.type === 'open_chat' && event.data.conversationId) {
        onOpenChat?.(event.data.conversationId);
      }
    };
    navigator.serviceWorker?.addEventListener('message', onSwMessage);

    // Tap on a notification that opened a fresh tab: deep link ?convId=...
    const params = new URLSearchParams(window.location.search);
    const convId = params.get('convId');
    if (convId) {
      onOpenChat?.(convId);
      window.history.replaceState({}, '', window.location.pathname);
    }

    return () => navigator.serviceWorker?.removeEventListener('message', onSwMessage);
  }, [onOpenChat]);

  return null;
}
