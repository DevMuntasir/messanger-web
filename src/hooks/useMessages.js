import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../services/apiClient';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

export function useMessages(conversationId) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [msgs, setMsgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const oldestIdRef = useRef(null);

  const fetchMessages = useCallback(async (before = null) => {
    if (!conversationId) return;
    try {
      const params = { limit: 30 };
      if (before) params.before = before;
      const res = await apiClient.get(`/api/messages/${conversationId}`, { params });
      const fetched = res.data;
      if (fetched.length < 30) setHasMore(false);
      if (before) {
        setMsgs(prev => [...fetched, ...prev]);
      } else {
        setMsgs(fetched);
        if (fetched.length > 0) oldestIdRef.current = fetched[0].id;
      }
    } catch (err) {
      console.warn('useMessages fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    setMsgs([]);
    setLoading(true);
    setHasMore(true);
    fetchMessages();
  }, [conversationId, fetchMessages]);

  useEffect(() => {
    if (!socket || !conversationId) return;

    const joinRoom = () => socket.emit('join_conversations', { conversationIds: [conversationId] });
    joinRoom();
    socket.on('connect', joinRoom);

    function onMessageReceived({ message }) {
      if (String(message.conversationId) !== String(conversationId)) return;
      const normalized = {
        ...message,
        from: message.senderId === user?.id ? 'me' : 'them',
      };
      setMsgs(prev => {
        if (prev.some(m => m.id === normalized.id)) return prev;
        if (normalized.from === 'me') {
          const idx = prev.findIndex(m => m.pending && m.from === 'me');
          if (idx !== -1) {
            const copy = prev.slice();
            copy[idx] = normalized;
            return copy;
          }
        }
        return [...prev, normalized];
      });
    }

    function onReactionUpdate(updatedMsg) {
      if (String(updatedMsg.conversationId) !== String(conversationId)) return;
      setMsgs(prev => prev.map(m => m.id === updatedMsg.id ? { ...m, react: updatedMsg.react } : m));
    }

    socket.on('message_received', onMessageReceived);
    socket.on('reaction_updated', onReactionUpdate);

    return () => {
      socket.off('connect', joinRoom);
      socket.off('message_received', onMessageReceived);
      socket.off('reaction_updated', onReactionUpdate);
      socket.emit('leave_conversation', { conversationId });
    };
  }, [socket, conversationId, user?.id, setMsgs]);

  const loadMore = useCallback(() => {
    if (!hasMore || loading || msgs.length === 0) return;
    fetchMessages(msgs[0].id);
  }, [hasMore, loading, msgs, fetchMessages]);

  const appendOptimistic = useCallback((msg) => {
    setMsgs(prev => [...prev, msg]);
  }, []);

  const applyReaction = useCallback(async (messageId, emoji) => {
    try {
      const res = await apiClient.patch(`/api/messages/${messageId}/reaction`, { emoji });
      setMsgs(prev => prev.map(m => m.id === messageId ? { ...m, react: res.data.react } : m));
    } catch (err) {
      console.warn('applyReaction error:', err);
    }
  }, []);

  return { msgs, setMsgs, loading, hasMore, loadMore, appendOptimistic, applyReaction };
}
