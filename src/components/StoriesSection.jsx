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
      console.log('StoriesSection friendsList:', friendsList);
      const friendIds = friendsList.map(f => f.id || f.userId);
      console.log('Friend IDs to fetch:', friendIds);
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

  const storyUsers = Object.entries(groupedByUser).map(([userId, stories]) => {
    const friend = friendsList?.find(f => f.id === userId || f.userId === userId);
    return {
      userId,
      stories: stories.sort((a, b) => b.createdAt - a.createdAt),
      ownerName: stories[0].ownerName,
      isOwn: stories[0].isOwn,
      avatar: stories[0].isOwn
        ? user?.avatar || user?.photoURL || user?.profile?.avatar
        : friend?.avatar || friend?.photoURL || friend?.profile?.avatar,
    };
  });

  const hasStories = storyUsers.length > 0;

  return (
    <>
      <div className="stories-section">
        <div className="stories-list">
          {/* Add Story button */}
          <div
            className="story-user-card add-story-card"
            onClick={() => setShowUploadModal(true)}
          >
            <div className="story-avatar-wrapper add-story-wrapper">
              <div className="story-avatar add-story-avatar">
                {user?.avatar || user?.photoURL || user?.profile?.avatar ? (
                  <img
                    src={user?.avatar || user?.photoURL || user?.profile?.avatar}
                    alt={user?.name || 'Add story'}
                  />
                ) : (
                  <div className="avatar-initials">{user?.initials || '+'}</div>
                )}
              </div>
              <button className="story-add-btn add-story-btn" title="Add story">
                +
              </button>
            </div>
            <p className="story-username">Add story</p>
          </div>

          {/* Friends' stories */}
          {storyUsers.map(({ userId, stories, ownerName, isOwn, avatar }) => (
            !isOwn && (
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
                  <div className="story-unread-indicator" />
                </div>
                <p className="story-username">{ownerName}</p>
              </div>
            )
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
