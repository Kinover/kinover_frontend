// fetchFamilyUserListThunk.js
import axios from 'axios';
import { Platform } from 'react-native';
import { getToken } from '../../utils/storage';
import {
  setFamilyUserList,
  setUserFamilyLoading,
  setUserFamilyError,
} from '../slices/userFamilySlice';

export const fetchFamilyUserListThunk = (familyId) => {
  return async (dispatch) => {
    dispatch(setUserFamilyLoading(true));
    try {
      const apiUrl =`http://43.200.47.242:9090/api/userFamily/familyUsers/${familyId}`;

      const token = await getToken();

      const response = await axios.post(apiUrl, {}, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      dispatch(setFamilyUserList(Array.isArray(response.data) ? response.data : []));
    } catch (error) {
      dispatch(setUserFamilyError(error.message));
    } finally {
      dispatch(setUserFamilyLoading(false));
    }
  };
};
