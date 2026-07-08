import { db } from '../config/firebase';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';

const STORY_EXPIRY_HOURS = 24;

export async function createStory(userId, imageUrl, caption) {
  try {
    console.log('Creating story in Firestore:', { userId, imageUrl, caption });

    const storiesRef = collection(db, 'stories');
    const expiresAt = new Date(Date.now() + STORY_EXPIRY_HOURS * 60 * 60 * 1000);

    const docRef = await addDoc(storiesRef, {
      userId,
      imageUrl,
      caption: caption || '',
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(expiresAt),
    });

    console.log('Story created with ID:', docRef.id);
    return { id: docRef.id, userId, imageUrl, caption };
  } catch (err) {
    console.error('Error creating story:', err);
    throw err;
  }
}

export async function getUserStories(userId) {
  try {
    console.log('Fetching stories for userId:', userId);

    const storiesRef = collection(db, 'stories');
    const now = new Date();

    // Query stories for this user
    const q = query(storiesRef, where('userId', '==', userId));
    const snap = await getDocs(q);

    console.log('Query returned docs:', snap.docs.length);

    const stories = snap.docs
      .map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
          expiresAt: data.expiresAt?.toDate?.() || new Date(data.expiresAt),
        };
      })
      .filter(s => {
        const expiresAt = s.expiresAt instanceof Date ? s.expiresAt : new Date(s.expiresAt);
        return expiresAt > now;
      })
      .sort((a, b) => b.createdAt - a.createdAt);

    console.log('Filtered stories:', stories.length, stories);
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
    const now = new Date();
    const storiesRef = collection(db, 'stories');

    for (const userId of userIds) {
      const q = query(storiesRef, where('userId', '==', userId));
      const snap = await getDocs(q);

      snap.docs.forEach(d => {
        const data = d.data();
        const story = {
          id: d.id,
          userId,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
          expiresAt: data.expiresAt?.toDate?.() || new Date(data.expiresAt),
        };

        const expiresAt = story.expiresAt instanceof Date ? story.expiresAt : new Date(story.expiresAt);
        if (expiresAt > now) {
          allStories.push(story);
        }
      });
    }

    return allStories.sort((a, b) => b.createdAt - a.createdAt);
  } catch (err) {
    console.error('Error fetching stories from users:', err);
    return [];
  }
}

export async function deleteStory(userId, storyId) {
  try {
    const storyRef = doc(db, 'stories', storyId);
    await deleteDoc(storyRef);
  } catch (err) {
    console.error('Error deleting story:', err);
    throw err;
  }
}

export async function deleteExpiredStories() {
  try {
    const storiesRef = collection(db, 'stories');
    const now = new Date();

    const q = query(storiesRef);
    const snap = await getDocs(q);

    for (const d of snap.docs) {
      const expiresAt = d.data().expiresAt?.toDate?.() || new Date(d.data().expiresAt);
      if (expiresAt < now) {
        await deleteDoc(d.ref);
      }
    }
  } catch (err) {
    console.error('Error deleting expired stories:', err);
  }
}
