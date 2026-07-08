import axios from 'axios';
import { getAuth } from 'firebase/auth';
import '../config/firebase';

const API_URL = import.meta.env.VITE_API_URL || 'https://messenger-atvk.onrender.com';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

apiClient.interceptors.request.use(async (config) => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject({
    ...error,
    userMessage: error.response?.data?.error || error.message || 'An API error occurred',
  })
);

export default apiClient;
