// fetchUserThunk.js
import axios from 'axios';
import {createAsyncThunk} from '@reduxjs/toolkit';
import {deleteLoginInfo, getToken} from '../../../utils/storage';
// import { removeToken } from '../utils/removeToken';
import {
  setUser,
  setUserLoading,
  setUserError,
  updateUser,
} from './userSlice';
import {updateFamilyUser} from './userFamilySlice';

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

export const deleteUserThunk = createAsyncThunk(
  'user/deleteUser',
  async (_, {rejectWithValue, dispatch}) => {
    try {
      const token = await getToken();

      const response = await axios.delete('https://kinover.shop/api/user/delete', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('✅ 회원 탈퇴 성공:', response.data);

      // ✅ 로그아웃 효과: 사용자 정보 초기화 & 토큰 삭제
      dispatch(setUser(null));
      await deleteLoginInfo(); // storage.js에 있는 거 맞지?

      return response.data;
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || error.message || '알 수 없는 오류';
      console.error('❌ 회원 탈퇴 실패:', errorMsg);
      return rejectWithValue(errorMsg);
    }
  },
);
