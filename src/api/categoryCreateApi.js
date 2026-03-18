import { apiClient } from 'utils/apiClient';
import {CATEGORIES} from 'config/apiEndpoints';

export const createCategory = async title => {
  try {
    const response = await apiClient.post(
      CATEGORIES.create,
      {title},
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    console.log('카테고리 생성 완료', response.data);
    return response.data;
  } catch (error) {
    console.error('카테고리 생성 실패:', error.response?.data || error.message);
    throw error;
  }
};
