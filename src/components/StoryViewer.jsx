import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStories } from '../context/StoryContext';
import './StoryViewer.css';

const STORY_DURATION = 5000; // 5 seconds per story

export default function StoryViewer({ stories, ownerName, onClose }) {
  const { user } = useAuth();
  const { removeStory } = useStories();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const progressInterval = useRef(null);

  const currentStory = stories[currentIndex];
  const isOwnStory = currentStory?.userId === user?.id;

  useEffect(() => {
    if (isPaused) return;

    const startTime = Date.now();
    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(elapsed / STORY_DURATION, 1);
      setProgress(newProgress);

      if (newProgress >= 1) {
        if (currentIndex < stories.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setProgress(0);
        } else {
          onClose();
        }
      }
    }, 50);

    return () => clearInterval(progressInterval.current);
  }, [currentIndex, stories.length, onClose, isPaused]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (isOwnStory && currentStory?.id) {
      if (confirm('Delete this story?')) {
        await removeStory(currentStory.id);
        if (currentIndex < stories.length - 1) {
          handleNext();
        } else {
          onClose();
        }
      }
    }
  };

  const handleTapLeft = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.clientX < rect.width / 3) {
      handlePrev();
    } else {
      setIsPaused(false);
    }
  };

  return (
    <div className="story-viewer-overlay" onClick={onClose}>
      <div
        className="story-viewer-container"
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Progress bar */}
        <div className="story-progress-bar">
          {stories.map((_, idx) => (
            <div
              key={idx}
              className="progress-segment"
              style={{
                flex: 1,
                backgroundColor: idx < currentIndex ? '#fff' : '#ffffff40',
                height: '3px',
                margin: '0 2px',
                borderRadius: '2px',
                transition: 'background-color 0.3s',
              }}
            >
              {idx === currentIndex && (
                <div
                  style={{
                    height: '100%',
                    backgroundColor: '#fff',
                    width: `${progress * 100}%`,
                    borderRadius: '2px',
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="story-viewer-header">
          <div className="story-viewer-user">
            <div className="story-viewer-avatar">
              {currentStory?.avatar ? (
                <img src={currentStory.avatar} alt={ownerName} />
              ) : (
                <div className="avatar-placeholder">{ownerName[0]}</div>
              )}
            </div>
            <div className="story-viewer-info">
              <p className="story-viewer-name">{ownerName}</p>
              <p className="story-viewer-time">
                {currentStory?.createdAt && formatStoryTime(currentStory.createdAt)}
              </p>
            </div>
          </div>

          <div className="story-viewer-actions">
            {isOwnStory && (
              <button
                className="story-action-btn delete-btn"
                onClick={handleDelete}
                title="Delete"
              >
                🗑️
              </button>
            )}
            <button
              className="story-action-btn close-btn"
              onClick={onClose}
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Image */}
        <div className="story-viewer-content">
          <img
            src={currentStory?.imageUrl}
            alt="Story"
            className="story-image"
            onClick={handleTapLeft}
          />

          {/* Caption */}
          {currentStory?.caption && (
            <div className="story-caption-display">
              {currentStory.caption}
            </div>
          )}

          {/* Navigation arrows */}
          {currentIndex > 0 && (
            <button
              className="story-nav-btn story-nav-prev"
              onClick={handlePrev}
            >
              ‹
            </button>
          )}
          {currentIndex < stories.length - 1 && (
            <button
              className="story-nav-btn story-nav-next"
              onClick={handleNext}
            >
              ›
            </button>
          )}
        </div>

        {/* Counter */}
        <div className="story-counter">
          {currentIndex + 1} / {stories.length}
        </div>
      </div>
    </div>
  );
}

function formatStoryTime(date) {
  if (!date) return '';
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}
