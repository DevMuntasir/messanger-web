import React, { useState } from 'react';
import { useStories } from '../context/StoryContext';
import { useAuth } from '../context/AuthContext';
import Icon from './Icon';
import Avatar from './Avatar';
import StoryUploadModal from './StoryUploadModal';
import StoryViewer from './StoryViewer';
import './StoriesSection.css';

export default function StoriesSection({ friendsList }) {
  const { myStories, friendStories, loadFriendStories } = useStories();
  const { user } = useAuth();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewingStory, setViewingStory] = useState(null);

  React.useEffect(() => {
    if (friendsList && friendsList.length > 0) {
      const friendIds = friendsList.map(f => f.id || f.userId);
      loadFriendStories(friendIds);
    }
  }, [friendsList, loadFriendStories]);

  const allStories = [
    ...myStories.map(s => ({ ...s, isOwn: true, ownerName: 'Your story' })),
    ...friendStories.map(s => ({
      ...s,
      isOwn: false,
      ownerName: friendsList?.find(f => f.id === s.userId || f.userId === s.userId)?.name || 'Unknown',
    })),
  ];

  const groupedByUser = {};
  allStories.forEach(story => {
    const key = story.userId;
    if (!groupedByUser[key]) {
      groupedByUser[key] = [];
    }
    groupedByUser[key].push(story);
  });

  const storyUsers = Object.entries(groupedByUser).map(([userId, stories]) => ({
    userId,
    stories: stories.sort((a, b) => b.createdAt - a.createdAt),
    ownerName: stories[0].ownerName,
    isOwn: stories[0].isOwn,
    avatar: stories[0].isOwn
      ? user?.avatar || user?.photoURL
      : friendsList?.find(f => f.id === userId || f.userId === userId)?.avatar ||
        friendsList?.find(f => f.id === userId || f.userId === userId)?.photoURL,
  }));

  if (storyUsers.length === 0) return null;

  return (
    <>
      <div className="stories-section">
        <div className="stories-list">
          {storyUsers.map(({ userId, stories, ownerName, isOwn, avatar }) => (
            <div
              key={userId}
              className="story-user-card"
              onClick={() => setViewingStory({ userId, stories, ownerName })}
            >
              <div className="story-avatar-wrapper">
                <img
                  src={avatar || `https://i.pravatar.cc/48?u=${userId}`}
                  alt={ownerName}
                  className="story-avatar"
                />
                {isOwn && (
                  <button
                    className="story-add-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowUploadModal(true);
                    }}
                    title="Add story"
                  >
                    +
                  </button>
                )}
                <div className="story-unread-indicator" />
              </div>
              <p className="story-username">{ownerName}</p>
            </div>
          ))}
        </div>
      </div>

      {showUploadModal && (
        <StoryUploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
          }}
        />
      )}

      {viewingStory && (
        <StoryViewer
          stories={viewingStory.stories}
          ownerName={viewingStory.ownerName}
          onClose={() => setViewingStory(null)}
        />
      )}
    </>
  );
}
