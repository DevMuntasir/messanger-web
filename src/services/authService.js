// authService — same auth flow as the app: Firebase email/password auth,
// then the backend user via /api/auth/*.
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import apiClient from './apiClient';

const ERROR_MESSAGES = {
  'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/weak-password': 'Password must be at least 6 characters long.',
  'auth/user-not-found': 'No account found with this email. Please sign up first.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/invalid-credential': 'Email or password is incorrect. Please try again.',
  'auth/too-many-requests': 'Too many login attempts. Please try again later.',
  'auth/operation-not-allowed': 'Sign up is currently disabled. Please try again later.',
  'auth/network-request-failed': 'Network error. Please check your internet connection.',
};

function mapFirebaseError(error) {
  const code = error.code || error.message;
  return ERROR_MESSAGES[code] || error.userMessage || error.message || 'Authentication failed. Please try again.';
}

export async function signUp(email, password, name, handle, g) {
  try {
    const auth = getAuth();
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const token = await cred.user.getIdToken();
    const res = await apiClient.post(
      '/api/auth/register',
      { name, handle, g },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data.user;
  } catch (error) {
    throw new Error(mapFirebaseError(error));
  }
}

export async function signIn(email, password) {
  try {
    const auth = getAuth();
    await signInWithEmailAndPassword(auth, email, password);
    const res = await apiClient.get('/api/auth/me');
    return res.data.user;
  } catch (error) {
    throw new Error(mapFirebaseError(error));
  }
}

export async function signOut() {
  await firebaseSignOut(getAuth());
}

export async function fetchMe() {
  const res = await apiClient.get('/api/auth/me');
  return res.data.user;
}

export async function updateMe(data) {
  const res = await apiClient.patch('/api/auth/me', data);
  return res.data.user;
}

export async function registerProfile(name, handle, g) {
  const res = await apiClient.post('/api/auth/register', { name, handle, g });
  return res.data.user;
}
