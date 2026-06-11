// GifPicker.jsx — Messenger-style GIF popover backed by the RedGifs API.
// No API key needed: fetches a temporary bearer token from /v2/auth/temporary,
// caches it module-wide, and refreshes it on 401. RedGifs media is silent mp4,
// not .gif — the grid shows static jpg thumbnails and tapping sends the mp4
// URL, which Bubble plays looped and muted in a <video> tag.
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Icon from './Icon';
import './GifPicker.css';

const API = 'https://api.redgifs.com';

let cachedToken = null;

async function getToken(force = false) {
  if (cachedToken && !force) return cachedToken;
  const res = await axios.get(`${API}/v2/auth/temporary`);
  cachedToken = res.data.token;
  return cachedToken;
}

async function rgGet(path, params, retry = true) {
  const token = await getToken();
  try {
    const res = await axios.get(`${API}${path}`, {
      params,
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (err) {
    // Temporary tokens expire — refresh once and retry
    if (retry && err.response?.status === 401) {
      await getToken(true);
      return rgGet(path, params, false);
    }
    throw err;
  }
}

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
      const data = q
        ? await rgGet('/v2/gifs/search', { search_text: q, order: 'trending', count: 30, page: 1 })
        : await rgGet('/v2/explore/trending-gifs');
      setGifs((data.gifs || []).filter(g => g.urls?.silent || g.urls?.sd));
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
                <img src={preview} alt={item.description || 'gif'} loading="lazy" />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
