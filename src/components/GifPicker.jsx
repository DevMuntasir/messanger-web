// GifPicker.jsx — Messenger-style GIF popover backed by the Tenor API,
// proxied through our backend (/api/gifs) for consistency.
import React, { useState, useEffect, useRef, useCallback } from 'react';
import apiClient from '../services/apiClient';
import Icon from './Icon';
import './GifPicker.css';

export default function GifPicker({ onSend, onClose }) {
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [safeMode, setSafeMode] = useState(true);
  const debounceTimer = useRef(null);
  const rootRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) onClose?.();
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [onClose]);

  const fetchGifs = useCallback(async (q) => {
    setLoading(true);
    try {
      const contentfilter = safeMode ? 'moderate' : 'off';
      const endpoint = q ? '/search' : '/featured';
      const params = q ? { q, contentfilter } : { contentfilter };
      const res = await apiClient.get(`/api/gifs${endpoint}`, { params });
      setGifs((res.data.results || []).filter(g => g.media && g.media[0]));
    } catch {
      setGifs([]);
    } finally {
      setLoading(false);
    }
  }, [safeMode]);

  useEffect(() => {
    fetchGifs('');
    return () => clearTimeout(debounceTimer.current);
  }, [fetchGifs]);

  const handleSearch = (val) => {
    setQuery(val);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => fetchGifs(val.trim()), 400);
  };

  const toggleSafeMode = () => {
    setSafeMode(prev => !prev);
  };

  return (
    <div className="gif-panel" ref={rootRef}>
      <div className="gif-header">
        <div className="gif-search">
          <Icon name="search" size={16} />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search GIFs"
            autoFocus
          />
        </div>
        <button
          className={`gif-mode-btn ${safeMode ? 'safe' : 'adult'}`}
          onClick={toggleSafeMode}
          title={safeMode ? 'Safe Mode: On' : 'Adult Mode: On'}
        >
          {safeMode ? '🔒' : '🔓'}
        </button>
      </div>
      <div className="gif-grid">
        {loading ? (
          <div className="gif-status">Loading…</div>
        ) : gifs.length === 0 ? (
          <div className="gif-status">No GIFs found</div>
        ) : (
          gifs.map(item => {
            if (!item.media || !item.media[0]) return null;
            const preview = item.media[0].tinygif?.url;
            const sendUrl = item.media[0].gif?.url;
            if (!preview || !sendUrl) return null;
            return (
              <button key={item.id} className="gif-item" onClick={() => onSend(sendUrl)}>
                <img src={preview} alt={item.title || 'gif'} loading="lazy" referrerPolicy="no-referrer" />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
