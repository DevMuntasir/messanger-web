import React, { useState, useEffect } from 'react';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';
import StoriesSection from '../components/StoriesSection';
import { useAuth } from '../context/AuthContext';
import { useConversations } from '../hooks/useConversations';
import apiClient from '../services/apiClient';
import './InboxPage.css';

export default function InboxPage({ onSelectConversation }) {
  const { user } = useAuth();
  const { conversations, loading, unreadTotal } = useConversations();
  const [activeTab, setActiveTab] = useState('conversations');
  const [searchQuery, setSearchQuery] = useState('');
  const [contactResults, setContactResults] = useState([]);
  const [contactLoading, setContactLoading] = useState(false);

  // Search contacts when query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setContactResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setContactLoading(true);
      try {
        const res = await apiClient.get(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
        setContactResults(res.data);
      } catch (err) {
        console.error('Search error:', err);
        setContactResults([]);
      } finally {
        setContactLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectContact = async (person) => {
    try {
      const res = await apiClient.post('/api/conversations', {
        participantId: person._id || person.id,
      });
      setSearchQuery('');
      onSelectConversation(res.data.id);
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  const filtered = conversations.filter((c) => {
    if (!searchQuery) return true;
    return (c.person.name + ' ' + c.preview).toLowerCase().includes(searchQuery.toLowerCase());
  });

  const online = conversations.filter(c => c.person?.online);

  // Group contacts by first letter
  const grouped = {};
  contactResults.forEach((person) => {
    const letter = (person.name || 'U')[0].toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(person);
  });
  const groups = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="inbox-page">
      {/* Header */}
      <div className="inbox-header">
        <div className="inbox-title">
          <h1>Messenger</h1>
          {unreadTotal > 0 && <span className="unread-badge">{unreadTotal}</span>}
        </div>
        <div className="inbox-actions">
          <button className="icon-btn" title="Camera">
            <Icon name="camera" size={22} />
          </button>
        </div>
      </div>

      {/* Stories Section */}
      {activeTab === 'conversations' && (
        <StoriesSection friendsList={conversations.map(c => ({ ...c.person, id: c.person?.id || c.id }))} />
      )}

      {/* Tabs */}
      <div className="inbox-tabs">
        <button
          className={`tab ${activeTab === 'conversations' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('conversations');
            setSearchQuery('');
          }}
        >
          <span>Inbox</span>
          {unreadTotal > 0 && <span className="tab-badge">{unreadTotal}</span>}
        </button>
        <button
          className={`tab ${activeTab === 'contacts' ? 'active' : ''}`}
          onClick={() => setActiveTab('contacts')}
        >
          <span>Contacts</span>
          <Icon name="compose" size={18} style={{ marginLeft: 'auto' }} gradient />
        </button>
      </div>

      {/* Search */}
      <div className="inbox-search">
        <input
          type="text"
          placeholder={activeTab === 'conversations' ? 'Search conversations...' : 'Search contacts...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Conversations Tab */}
      {activeTab === 'conversations' && (
        <>
          {/* Active/Online */}
          {!searchQuery && online.length > 0 && (
            <div className="active-section">
              <div className="active-row">
                {online.map((c) => (
                  <div
                    key={c.id}
                    className="active-cell"
                    onClick={() => onSelectConversation(c.id)}
                  >
                    <Avatar person={c.person} size={56} online ring />
                    <span className="active-name">{c.person.name.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conversations List */}
          <div className="inbox-content">
            {loading && conversations.length === 0 ? (
              <div className="loading-state">
                <div className="spinner" />
                <p>Loading chats...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <Icon name="compose" size={48} />
                <p>
                  {searchQuery ? `No conversations match "${searchQuery}"` : 'No conversations yet. Start by searching for contacts!'}
                </p>
              </div>
            ) : (
              <div className="conv-list">
                {filtered.map((conv) => (
                  <ConversationRow
                    key={conv.id}
                    conv={conv}
                    onOpen={() => onSelectConversation(conv.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Contacts Tab */}
      {activeTab === 'contacts' && (
        <div className="inbox-content">
          {contactLoading && (
            <div className="loading-state">
              <div className="spinner" />
            </div>
          )}

          {!searchQuery && !contactLoading && (
            <div className="empty-state">
              <p>Start typing to search for contacts</p>
            </div>
          )}

          {searchQuery && contactResults.length === 0 && !contactLoading && (
            <div className="empty-state">
              <p>No contacts found matching "{searchQuery}"</p>
            </div>
          )}

          {contactResults.length > 0 && (
            <div className="contact-list">
              {groups.map(([letter, people]) => (
                <div key={letter} className="contact-group">
                  <div className="group-letter">{letter}</div>
                  {people.map((person) => (
                    <ContactRow
                      key={person._id || person.id}
                      person={person}
                      onSelect={() => handleSelectContact(person)}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ConversationRow({ conv, onOpen }) {
  const p = conv.person;
  const unread = !!conv.unread;

  return (
    <div
      className={`conv-row ${unread ? 'conv-unread' : ''}`}
      onClick={onOpen}
    >
      <Avatar person={p} size={54} online={p.online} />
      <div className="conv-body">
        <div className="conv-top">
          <span className="conv-name" style={{ fontWeight: unread ? 800 : 600 }}>
            {p.name}
          </span>
          <span className="conv-time">{conv.time}</span>
        </div>
        <div className="conv-preview">
          <span className="conv-text" style={{ fontWeight: unread ? 600 : 400 }}>
            {conv.preview}
          </span>
          {unread ? (
            <span className="unread-indicator">{conv.unread}</span>
          ) : (
            <span className="seen-indicator">✓</span>
          )}
        </div>
      </div>
    </div>
  );
}

function ContactRow({ person, onSelect }) {
  return (
    <div className="contact-row" onClick={onSelect}>
      <Avatar person={person} size={48} online={person.online} fontSize={17} />
      <div className="contact-info">
        <div className="contact-name">{person.name}</div>
        <div className="contact-handle">@{person.handle}</div>
      </div>
    </div>
  );
}
