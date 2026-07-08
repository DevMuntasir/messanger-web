import apiClient from './apiClient';

export async function createStory(userId, imageUrl, caption) {
  try {
    console.log('Creating story via backend:', { imageUrl, caption });

    const res = await apiClient.post('/api/stories', {
      imageUrl,
      caption: caption || '',
    });

    console.log('Story created:', res.data);
    return res.data;
  } catch (err) {
    console.error('Error creating story:', err);
    throw err;
  }
}

export async function getUserStories(userId) {
  try {
    console.log('Fetching stories for userId:', userId);

    const res = await apiClient.get(`/api/stories/user/${userId}`);
    const stories = res.data || [];

    console.log('Stories fetched:', stories);
    return stories;
  } catch (err) {
    console.error('Error fetching user stories:', err);
    return [];
  }
}

export async function getStoriesFromUsers(userIds) {
  if (!userIds || userIds.length === 0) return [];

  try {
    console.log('Fetching stories from users:', userIds);

    const res = await apiClient.post('/api/stories/users', { userIds });
    const stories = res.data || [];

    console.log('Stories from users fetched:', stories);
    return stories;
  } catch (err) {
    console.error('Error fetching stories from users:', err);
    return [];
  }
}

export async function deleteStory(userId, storyId) {
  try {
    console.log('Deleting story:', storyId);

    await apiClient.delete(`/api/stories/${storyId}`);

    console.log('Story deleted');
  } catch (err) {
    console.error('Error deleting story:', err);
    throw err;
  }
}

export async function deleteExpiredStories() {
  try {
    console.log('Cleaning up expired stories');

    await apiClient.post('/api/stories/cleanup');

    console.log('Cleanup completed');
  } catch (err) {
    console.error('Error cleaning up stories:', err);
  }
}
