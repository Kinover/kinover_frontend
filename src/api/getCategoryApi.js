import { apiClient } from 'utils/apiClient';
import {CATEGORIES} from 'config/apiEndpoints';

export const getCategoryApi = async () => {
  try {
    const response = await apiClient.get(CATEGORIES.list);

    return response.data; // [{ categoryId, title, familyId, createdAt }, ...]
  } catch (error) {
      '카테고리 불러오기 실패:',
      error.response?.data || error.message
    );
    throw error;
  }
};
