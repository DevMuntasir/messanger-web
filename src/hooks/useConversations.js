import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../services/apiClient';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

export function useConversations() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const joinedIdsRef = useRef(null);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      const res = await apiClient.get('/api/conversations');
      setConversations(res.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!socket || conversations.length === 0) return;

    const convIds = conversations.map(c => c.id);
    const convIdsStr = JSON.stringify(convIds.sort());

    if (joinedIdsRef.current !== convIdsStr) {
      socket.emit('join_conversations', { conversationIds: convIds });
      joinedIdsRef.current = convIdsStr;
    }

    const joinRooms = () => socket.emit('join_conversations', { conversationIds: convIds });
    socket.on('connect', joinRooms);

    function onMessageReceived({ message, conversation }) {
      setConversations(prev =>
        prev.map(c => {
          if (String(c.id) !== String(conversation.id)) return c;
          const unreadEntry = conversation.unreadCounts?.find(
            u => String(u.userId) === String(user?.id)
          );
          const newUnread = unreadEntry ? unreadEntry.count : c.unread;
          const isMe = message.senderId === user?.id;
          const preview = buildPreview(message, isMe);
          return {
            ...c,
            unread: newUnread,
            time: message.time,
            preview,
            seen: newUnread === 0,
          };
        })
      );
    }

    function onPresenceUpdate({ userId, online }) {
      setConversations(prev =>
        prev.map(c => {
          if (c.person?.id !== userId) return c;
          return { ...c, person: { ...c.person, online }, sub: online ? 'Active now' : 'Active recently' };
        })
      );
    }

    socket.on('message_received', onMessageReceived);
    socket.on('presence_update', onPresenceUpdate);
    return () => {
      socket.off('connect', joinRooms);
      socket.off('message_received', onMessageReceived);
      socket.off('presence_update', onPresenceUpdate);
    };
  }, [socket, conversations, user?.id]);

  const unreadTotal = conversations.reduce((n, c) => n + (c.unread || 0), 0);

  return { conversations, loading, error, refresh: fetchConversations, unreadTotal };
}

function buildPreview(msg, isMe) {
  const prefix = isMe ? 'You: ' : '';
  if (msg.kind === 'image') return `${prefix}📷 Photo`;
  if (msg.kind === 'voice') return `${prefix}🎤 Voice message`;
  return `${prefix}${msg.text || ''}`;
}
