import React, { useState, useEffect } from 'react';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';
import apiClient from '../services/apiClient';
import './NewMessagePage.css';

export default function NewMessagePage({ onSelectContact, onBack }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/api/users/search?q=${encodeURIComponent(query)}`);
        setResults(res.data);
      } catch (err) {
        console.error('Search error:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectContact = async (person) => {
    try {
      const res = await apiClient.post('/api/conversations', {
        participantId: person._id || person.id,
      });
      onSelectContact(res.data.id);
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  // Group results by first letter
  const grouped = {};
  results.forEach((person) => {
    const letter = (person.name || 'U')[0].toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(person);
  });
  const groups = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="new-message-page">
      {/* Header */}
      <div className="new-message-header">
        <button className="back-btn" onClick={onBack}>
          <Icon name="back" size={24} />
        </button>
        <h1>New Message</h1>
        <div style={{ width: 40 }} /> {/* Spacer for centering */}
      </div>

      {/* Search Input */}
      <div className="new-message-search">
        <span className="search-label">To:</span>
        <input
          type="text"
          autoFocus
          placeholder="Type a name or @handle"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Results */}
      <div className="new-message-results">
        {loading && (
          <div className="loading-state">
            <div className="spinner" />
          </div>
        )}

        {query && results.length === 0 && !loading && (
          <div className="empty-state">
            <p>No people found matching "{query}"</p>
          </div>
        )}

        {!query && results.length === 0 && (
          <div className="empty-state">
            <p>Start typing to search for contacts</p>
          </div>
        )}

        {groups.map(([letter, people]) => (
          <div key={letter} className="result-group">
            <div className="group-letter">{letter}</div>
            {people.map((person) => (
              <div
                key={person._id || person.id}
                className="result-item"
                onClick={() => handleSelectContact(person)}
              >
                <Avatar
                  person={person}
                  size={48}
                  online={person.online}
                  fontSize={17}
                />
                <div className="result-info">
                  <div className="result-name">{person.name}</div>
                  <div className="result-handle">@{person.handle}</div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
