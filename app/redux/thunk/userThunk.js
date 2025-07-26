// fetchUserThunk.js
import axios from 'axios';
import {Platform} from 'react-native';
import {getToken} from '../../utils/storage';
import {
  setUser,
  setUserLoading,
  setUserError,
  updateUser,
} from '../slices/userSlice';
import {updateFamilyUser} from '../slices/userFamilySlice';
import {useSelector} from 'react-redux';

export const fetchUserThunk = () => {
  return async dispatch => {
    dispatch(setUserLoading(true));
    try {
      const apiUrl = 'https://kinover.shop/api/user/userinfo';

      const token = await getToken();

      const response = await axios.get(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(response.data);
      dispatch(setUser(response.data));
    } catch (error) {
      dispatch(setUserError(error.message));
    } finally {
      dispatch(setUserLoading(false));
    }
  };
};

export const modifyUserThunk = updatedUser => {
  return async (dispatch, getState) => {
    dispatch(setUserLoading(true));
    try {
      const apiUrl = 'https://kinover.shop/api/user/modify';

      const token = await getToken();

      const response = await axios.post(apiUrl, updatedUser, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      // ✅ 본인일 경우 본인 상태도 같이 업데이트
      const currentUser = getState().user;
      if (updatedUser.userId === currentUser.userId) {
        dispatch(updateUser(response.data)); // 이거 맞지?
      } else {
        dispatch(updateFamilyUser(response.data));
      }

      console.log('✅ 프로필 수정 완료:', response.data);
    } catch (error) {
      console.error('❌ 프로필 수정 실패:', error);
      dispatch(setUserError(error.message));
    } finally {
      dispatch(setUserLoading(false));
    }
  };
};
