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

    return response.data;
  } catch (error) {
    throw error;
  }
};
