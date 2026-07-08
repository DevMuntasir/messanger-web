import React, { useState, useRef } from 'react';
import { useStories } from '../context/StoryContext';
import apiClient from '../services/apiClient';
import './StoryUploadModal.css';

export default function StoryUploadModal({ onClose, onSuccess }) {
  const { uploadStory } = useStories();
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const previewRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handlePublish = async () => {
    if (!selectedImage || !selectedFile) {
      alert('Please select an image');
      return;
    }

    if (uploading) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await apiClient.post('/api/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await uploadStory(res.data.url, caption);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      alert('Failed to publish story: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="story-modal-overlay" onClick={onClose}>
      <div className="story-modal" onClick={(e) => e.stopPropagation()}>
        <div className="story-modal-header">
          <h2>Share Story</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="story-modal-content">
          {selectedImage ? (
            <div className="story-preview">
              <img src={selectedImage} alt="Story preview" ref={previewRef} />
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption..."
                className="story-caption-input"
                maxLength={200}
              />
              <div className="caption-count">{caption.length}/200</div>
            </div>
          ) : (
            <div className="story-upload-area" onClick={() => fileRef.current?.click()}>
              <div className="upload-icon">📷</div>
              <p>Click to select an image</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleImageSelect}
              />
            </div>
          )}
        </div>

        <div className="story-modal-footer">
          {selectedImage && (
            <button
              className="story-change-btn"
              onClick={() => {
                setSelectedImage(null);
                setSelectedFile(null);
                fileRef.current?.click();
              }}
              disabled={uploading}
            >
              Change Image
            </button>
          )}
          <button
            className="story-publish-btn"
            onClick={selectedImage ? handlePublish : () => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Publishing...' : selectedImage ? 'Share' : 'Select Image'}
          </button>
        </div>
      </div>
    </div>
  );
}
