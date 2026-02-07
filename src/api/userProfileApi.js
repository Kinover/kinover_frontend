import { apiClient } from 'utils/apiClient';
import {getToken} from 'utils/storage';

export async function updateUserProfile(payload) {
  try {
    const token = await getToken();
    const res = await apiClient.patch(
      'https://kinover.shop/api/user/profile',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return res.data;
  } catch (err) {
    console.error('❌ updateUserProfile Error:', err);
    throw err;
  }
}
