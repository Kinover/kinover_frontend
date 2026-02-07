// 📁 /api/uploadPostApi.js
import { apiClient } from 'utils/apiClient';
import { getToken } from '../utils/storage';

export const uploadPostApi = async (postData) => {
  try {
    const token = await getToken();
    if (!token) throw new Error('로그인이 필요합니다.');

    const response = await apiClient.post(
      'http://43.200.47.242:9090/api/posts',
      postData,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('📛 게시글 업로드 실패:', error.response?.data || error.message);
    throw error;
  }
};
