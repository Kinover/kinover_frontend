// fetchUserThunk.js
import axios from 'axios';
import { Platform } from 'react-native';
import { getToken } from '../../utils/storage';
import { setUser, setUserLoading, setUserError } from '../slices/userSlice';

export const fetchUserThunk = () => {
  return async (dispatch) => {
    dispatch(setUserLoading(true));
    try {
      const apiUrl = 'http://43.200.47.242:9090/api/user/userinfo';

      const token = await getToken();

      const response = await axios.post(apiUrl, {}, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      dispatch(setUser(response.data));
    } catch (error) {
      dispatch(setUserError(error.message));
    } finally {
      dispatch(setUserLoading(false));
    }
  };
};
export const modifyUserThunk = (user) => {
  return async (dispatch) => {
    dispatch(setUserLoading(true));
    try {
      const apiUrl =
        Platform.OS === 'android'
          ? 'http://localhost:3001/api/user/modify'
          : 'http://localhost:3001/api/user/modify';

      const token = await getToken();

      const response = await axios.post(apiUrl, user, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true, // ✅ 요거 꼭 필요함!

      });

      dispatch(setUser(response.data));
      console.log('✅ 프로필 수정 완료:', response.data);
    } catch (error) {
      console.error('❌ 프로필 수정 실패:', error);
      dispatch(setUserError(error.message));
    } finally {
      dispatch(setUserLoading(false));
    }
  };
};
