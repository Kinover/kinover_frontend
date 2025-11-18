import axios from 'axios';
import { getToken } from '../utils/storage';

export const createCategory = async (title, familyId) => {
  try {
    const token = await getToken();

    if (!token) {
      throw new Error('로그인이 필요합니다.');
    }

    const response = await axios.post(
      'https://kinover.shop/api/categories',
      {
        title,
        familyId: String(familyId), // UUID 문자열로 보장
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // ✅ 반드시 포함
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('카테고리 생성 실패:', error.response?.data || error.message);
    throw error;
  }
};
