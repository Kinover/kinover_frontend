import { apiClient } from 'utils/apiClient';

export async function updateUserProfile(payload) {
  try {
    const res = await apiClient.post('/user/modify', payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return res.data;
  } catch (err) {
    throw err;
  }
}
