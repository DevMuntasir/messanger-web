import apiClient from './apiClient';

export async function createStory(userId, imageUrl, caption) {
  try {
    console.log('Creating story via API:', { userId, imageUrl, caption });

    const res = await apiClient.post('/api/stories', {
      imageUrl,
      caption: caption || '',
    });

    console.log('Story created:', res.data);
    return res.data;
  } catch (err) {
    console.error('Error in createStory:', err);
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
    await apiClient.delete(`/api/stories/${storyId}`);
  } catch (err) {
    console.error('Error deleting story:', err);
    throw err;
  }
}

export async function deleteExpiredStories() {
  try {
    await apiClient.post('/api/stories/cleanup');
  } catch (err) {
    console.error('Error cleaning up expired stories:', err);
  }
}
