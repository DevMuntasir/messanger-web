// GifPicker.jsx — Messenger-style GIF popover backed by the RedGifs API,
// proxied through our backend (/api/gifs) because RedGifs CORS only allows
// localhost and redgifs.com origins. RedGifs media is silent mp4, not .gif —
// the grid shows static jpg thumbnails and tapping sends the mp4 URL, which
// Bubble plays looped and muted in a <video> tag.
import React, { useState, useEffect, useRef, useCallback } from 'react';
import apiClient from '../services/apiClient';
import Icon from './Icon';
import './GifPicker.css';

export default function GifPicker({ onSend, onClose }) {
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(true);
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
      const res = q
        ? await apiClient.get('/api/gifs/search', { params: { q } })
        : await apiClient.get('/api/gifs/trending');
      setGifs((res.data.gifs || []).filter(g => g.urls?.silent || g.urls?.sd));
    } catch {
      setGifs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGifs('');
    return () => clearTimeout(debounceTimer.current);
  }, [fetchGifs]);

  const handleSearch = (val) => {
    setQuery(val);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => fetchGifs(val.trim()), 400);
  };

  return (
    <div className="gif-panel" ref={rootRef}>
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
      <div className="gif-grid">
        {loading ? (
          <div className="gif-status">Loading…</div>
        ) : gifs.length === 0 ? (
          <div className="gif-status">No GIFs found</div>
        ) : (
          gifs.map(item => {
            const preview = item.urls?.thumbnail || item.urls?.poster;
            const sendUrl = item.urls?.silent || item.urls?.sd;
            if (!preview || !sendUrl) return null;
            return (
              <button key={item.id} className="gif-item" onClick={() => onSend(sendUrl)}>
                <img src={preview} alt={item.description || 'gif'} loading="lazy" referrerPolicy="no-referrer" />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
