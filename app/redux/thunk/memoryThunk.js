// fetchMemoryThunk.js
import axios from 'axios';
import { Platform } from 'react-native';
import { getToken } from '../../utils/storage';
import {
  setMemoryList,
  setMemoryLoading,
  setMemoryError,
} from '../slices/memorySlice';

export const fetchMemoryThunk = (familyId) => {
  return async (dispatch) => {
    dispatch(setMemoryLoading(true));
    try {
      const apiUrl =
        Platform.OS === 'android'
          ? `http://13.209.70.77:8080/api/memory/${familyId}`
          : `http://13.209.70.77:8080/api/memory/${familyId}`;

      const token = await getToken();

      const response = await axios.post(apiUrl, {}, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      dispatch(setMemoryList(response.data));
    } catch (error) {
      dispatch(setMemoryError(error.message));
    } finally {
      dispatch(setMemoryLoading(false));
    }
  };
};
