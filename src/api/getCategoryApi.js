import axios from 'axios';
import { getToken } from '../utils/storage';

export const getCategoryApi = async (familyId) => {
  try {
    const token = await getToken();

    if (!token) {
      throw new Error('로그인이 필요합니다.');
    }

    const response = await axios.get(
      `https://kinover.shop/api/categories/${familyId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    return response.data; // [{ categoryId, title, familyId, createdAt }, ...]
  } catch (error) {
    console.error(
      '카테고리 불러오기 실패:',
      error.response?.data || error.message
    );
    throw error;
  }
};
