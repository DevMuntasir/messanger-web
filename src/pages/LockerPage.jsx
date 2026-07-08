// LockerPage — private vault where the user stores photos & videos
// from their device. Media is uploaded to Cloudinary through the backend.
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Icon from '../components/Icon';
import {
  fetchLockerItems, uploadLockerFile, deleteLockerItem, videoThumbUrl,
} from '../services/lockerService';
import './LockerPage.css';

// Small Cloudinary transform so the grid doesn't download full-size media.
function gridThumb(item) {
  const base = item.kind === 'video' ? videoThumbUrl(item.url) : item.url;
  return base.replace('/upload/', '/upload/w_400,h_400,c_fill,q_auto/');
}

function fmtDuration(sec) {
  if (!sec) return '';
  const s = Math.round(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function LockerPage({ onBack }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(null); // { done, total }
  const [viewer, setViewer] = useState(null);       // item being viewed
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchLockerItems();
      setItems(data);
    } catch (err) {
      alert('Locker: ' + (err.userMessage || err.message));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleFilesChosen = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 10);
    e.target.value = '';
    if (files.length === 0) return;

    setUploading({ done: 0, total: files.length });
    const uploaded = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const item = await uploadLockerFile(files[i]);
        uploaded.push(item);
      } catch (err) {
        alert('Upload failed: ' + (err.userMessage || err.message));
      }
      setUploading({ done: i + 1, total: files.length });
    }
    if (uploaded.length) setItems((prev) => [...uploaded.reverse(), ...prev]);
    setUploading(null);
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Delete from Locker? This will permanently remove it from your locker.')) return;
    try {
      await deleteLockerItem(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setViewer(null);
    } catch (err) {
      alert('Locker: ' + (err.userMessage || err.message));
    }
  };

  return (
    <div className="locker-page">
      <div className="locker-header">
        {onBack && (
          <button className="back-btn" onClick={onBack}>
            <Icon name="back" size={24} />
          </button>
        )}
        <h1 className="locker-title">Locker</h1>
        <button className="locker-add" title="Add media" onClick={() => fileRef.current?.click()}>
          <Icon name="plus" size={22} color="white" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          multiple
          hidden
          onChange={handleFilesChosen}
        />
      </div>

      {uploading && (
        <div className="locker-upload-bar">
          <div className="spinner spinner-small" />
          <span>Uploading {Math.min(uploading.done + 1, uploading.total)} of {uploading.total}…</span>
        </div>
      )}

      {loading ? (
        <div className="locker-center">
          <div className="spinner" />
        </div>
      ) : items.length === 0 ? (
        <div className="locker-center">
          <div className="locker-empty-icon">
            <Icon name="lock" size={30} color="white" />
          </div>
          <p className="locker-empty-title">Your Locker is empty</p>
          <p className="locker-empty-sub">
            Keep photos and videos safe here.<br />Tap + to upload from your device.
          </p>
        </div>
      ) : (
        <div className="locker-grid">
          {items.map((item) => (
            <button key={item.id} className="locker-tile" onClick={() => setViewer(item)}>
              <img src={gridThumb(item)} alt="" loading="lazy" />
              {item.kind === 'video' && (
                <span className="locker-video-badge">
                  <Icon name="video" size={13} color="white" />
                  {fmtDuration(item.duration)}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {viewer && (
        <div className="locker-viewer">
          {viewer.kind === 'video' ? (
            <video src={viewer.url} className="locker-viewer-media" controls autoPlay playsInline />
          ) : (
            <img src={viewer.url} alt="" className="locker-viewer-media" />
          )}
          <div className="locker-viewer-bar">
            <button className="locker-viewer-btn" onClick={() => setViewer(null)}>
              <Icon name="back" size={22} color="white" />
            </button>
            <button className="locker-viewer-btn" onClick={() => handleDelete(viewer)}>
              <Icon name="trash" size={20} color="#ff5d73" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
