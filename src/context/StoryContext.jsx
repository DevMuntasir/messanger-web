import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getUserStories, getStoriesFromUsers, createStory, deleteStory } from '../services/storyService';
import { useAuth } from './AuthContext';

const StoryContext = createContext(null);

export function StoryProvider({ children }) {
  const { user } = useAuth();
  const [myStories, setMyStories] = useState([]);
  const [friendStories, setFriendStories] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadMyStories = useCallback(async () => {
    if (!user?.id) {
      console.error('No user ID for loading stories');
      return;
    }
    setLoading(true);
    try {
      console.log('Loading stories for user:', user.id);
      const stories = await getUserStories(user.id);
      console.log('Stories loaded:', stories);
      setMyStories(stories);
    } catch (err) {
      console.error('Error loading my stories:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const loadFriendStories = useCallback(async (friendIds) => {
    if (!friendIds || friendIds.length === 0) {
      setFriendStories([]);
      return;
    }
    setLoading(true);
    try {
      const stories = await getStoriesFromUsers(friendIds);
      setFriendStories(stories);
    } catch (err) {
      console.error('Error loading friend stories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadStory = useCallback(async (imageUrl, caption) => {
    if (!user?.id) {
      console.error('No user ID for story upload');
      return null;
    }
    try {
      console.log('Creating story with userId:', user.id);
      const story = await createStory(user.id, imageUrl, caption);
      console.log('Story created:', story);
      // Reload stories after upload
      setTimeout(() => {
        console.log('Loading stories after upload...');
        loadMyStories();
      }, 500);
      return story;
    } catch (err) {
      console.error('Error uploading story:', err);
      throw err;
    }
  }, [user?.id, loadMyStories]);

  const removeStory = useCallback(async (storyId) => {
    if (!user?.id) return;
    try {
      await deleteStory(user.id, storyId);
      await loadMyStories();
    } catch (err) {
      console.error('Error deleting story:', err);
    }
  }, [user?.id, loadMyStories]);

  useEffect(() => {
    loadMyStories();
  }, [loadMyStories]);

  return (
    <StoryContext.Provider
      value={{
        myStories,
        friendStories,
        loading,
        loadMyStories,
        loadFriendStories,
        uploadStory,
        removeStory,
      }}
    >
      {children}
    </StoryContext.Provider>
  );
}

export function useStories() {
  const ctx = useContext(StoryContext);
  if (!ctx) throw new Error('useStories must be used within StoryProvider');
  return ctx;
}
