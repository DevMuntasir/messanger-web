// lockerService — private media vault. Pick images/videos from the device,
// upload them to Cloudinary via the backend, list and delete items.
import apiClient from './apiClient';

export async function fetchLockerItems() {
  const res = await apiClient.get('/api/locker');
  return res.data;
}

export async function uploadLockerFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await apiClient.post('/api/locker/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000, // videos can take a while
  });
  return res.data;
}

export async function deleteLockerItem(id) {
  const res = await apiClient.delete(`/api/locker/${id}`);
  return res.data;
}

// Cloudinary can render a jpg poster for any video by swapping the extension.
export function videoThumbUrl(url) {
  return url.replace(/\.[^/.]+$/, '.jpg');
}
