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
      const apiUrl =`http://43.200.47.242:9090/api/memory/${familyId}`;

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
