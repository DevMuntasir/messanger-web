// PeoplePage — web port of the app's PeopleScreen: everyone on the platform,
// tap to start (or reopen) a conversation.
import React, { useState, useEffect, useCallback } from 'react';
import Avatar from '../components/Avatar';
import apiClient from '../services/apiClient';
import './PeoplePage.css';

export default function PeoplePage({ onSelectConversation }) {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchContacts = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/users/search', { params: { q: '' } });
      setPeople(res.data);
    } catch (err) {
      console.warn('PeoplePage fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const openChat = async (person) => {
    try {
      const res = await apiClient.post('/api/conversations', {
        participantId: person._id || person.id,
      });
      onSelectConversation(res.data.id);
    } catch (err) {
      alert('Could not open chat: ' + (err.userMessage || err.message));
    }
  };

  return (
    <div className="people-page">
      <div className="people-header">
        <h1>People</h1>
      </div>
      {loading ? (
        <div className="people-center"><div className="spinner" /></div>
      ) : people.length === 0 ? (
        <div className="people-center"><p>No people found yet</p></div>
      ) : (
        <div className="people-list">
          {people.map((person) => (
            <button
              key={person._id || person.id}
              className="people-row"
              onClick={() => openChat(person)}
            >
              <Avatar person={person} size={50} online={person.online} />
              <div className="people-info">
                <span className="people-name">{person.name}</span>
                <span className="people-handle">@{person.handle}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
