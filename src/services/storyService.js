import { db } from '../config/firebase';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';

const STORY_EXPIRY_HOURS = 24;

export async function createStory(userId, imageUrl, caption) {
  const storiesRef = collection(db, 'stories');
  const expiresAt = new Date(Date.now() + STORY_EXPIRY_HOURS * 60 * 60 * 1000);

  const story = await addDoc(storiesRef, {
    userId,
    imageUrl,
    caption: caption || '',
    createdAt: Timestamp.now(),
    expiresAt: Timestamp.fromDate(expiresAt),
  });

  return story;
}

export async function getUserStories(userId) {
  try {
    const storiesRef = collection(db, 'stories');
    const now = Timestamp.now();

    const q = query(
      storiesRef,
      where('userId', '==', userId),
      where('expiresAt', '>', now),
      orderBy('expiresAt', 'desc')
    );

    const snap = await getDocs(q);
    const stories = snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.(),
      expiresAt: d.data().expiresAt?.toDate?.(),
    }));

    return stories;
  } catch (err) {
    console.error('Error fetching user stories:', err);
    return [];
  }
}

export async function getStoriesFromUsers(userIds) {
  if (!userIds || userIds.length === 0) return [];

  try {
    const allStories = [];
    const now = Timestamp.now();
    const storiesRef = collection(db, 'stories');

    for (const userId of userIds) {
      const q = query(
        storiesRef,
        where('userId', '==', userId),
        where('expiresAt', '>', now),
        orderBy('expiresAt', 'desc')
      );

      const snap = await getDocs(q);
      snap.docs.forEach(d => {
        allStories.push({
          id: d.id,
          userId,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate?.(),
          expiresAt: d.data().expiresAt?.toDate?.(),
        });
      });
    }

    return allStories.sort((a, b) => b.createdAt - a.createdAt);
  } catch (err) {
    console.error('Error fetching stories from users:', err);
    return [];
  }
}

export async function deleteStory(userId, storyId) {
  const storyRef = doc(db, 'stories', storyId);
  await deleteDoc(storyRef);
}

export async function deleteExpiredStories() {
  try {
    const storiesRef = collection(db, 'stories');
    const now = Timestamp.now();

    const q = query(
      storiesRef,
      where('expiresAt', '<', now)
    );

    const snap = await getDocs(q);
    const batch = writeBatch(db);

    snap.docs.forEach(d => {
      batch.delete(d.ref);
    });

    await batch.commit();
  } catch (err) {
    console.error('Error deleting expired stories:', err);
  }
}
