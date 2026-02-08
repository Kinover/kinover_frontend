// fetchUserThunk.js

import {createAsyncThunk} from '@reduxjs/toolkit';
import {apiClient} from '../../../utils/apiClient';
import {deleteLoginInfo} from '../../../utils/storage';

import {setUser, setUserLoading, setUserError, updateUser} from './userSlice';
import {updateFamilyUser} from './userFamilySlice';

export const fetchUserThunk = createAsyncThunk(
  'user/fetchUser',
  async (_, {dispatch, rejectWithValue}) => {
    dispatch(setUserLoading(true));
    dispatch(setUserError(null));

    try {
      const res = await apiClient.get('/user/userinfo', {
        headers: {'Content-Type': 'application/json'},
      });

      console.log('[fetchUserThunk] dto:', res.data);

      // ✅ store 업데이트 유지
      dispatch(setUser(res.data));

      // ✅✅✅ 핵심: 오토로그인/로그인에서 쓰도록 DTO 반환
      return res.data;
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        '유저 정보 조회 실패';

      dispatch(setUserError(msg));
      return rejectWithValue(msg);
    } finally {
      dispatch(setUserLoading(false));
    }
  },
);

export const modifyUserThunk = updatedUser => {
  return async (dispatch, getState) => {
    dispatch(setUserLoading(true));
    try {
      // POST /api/user/modify
      const res = await apiClient.post('/user/modify', updatedUser, {
        headers: {'Content-Type': 'application/json'},
      });

      // ✅ 본인일 경우 본인 상태도 같이 업데이트
      // ⚠️ getState().user 구조가 "slice state"인지 "user 객체"인지에 따라 달라서,
      // 기존 코드를 최대한 유지하면서 안전하게 처리
      const stateUser = getState()?.user;
      const currentUserId =
        stateUser?.userId ?? stateUser?.user?.userId ?? null;

      if (updatedUser?.userId != null && String(updatedUser.userId) === String(currentUserId)) {
        dispatch(updateUser(res.data));
      } else {
        dispatch(updateFamilyUser(res.data));
      }

      console.log('✅ 프로필 수정 완료:', res.data);
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        '프로필 수정 실패';

      console.error('❌ 프로필 수정 실패:', msg);
      dispatch(setUserError(msg));
    } finally {
      dispatch(setUserLoading(false));
    }
  };
};

export const deleteUserThunk = createAsyncThunk(
  'user/deleteUser',
  async (_, {rejectWithValue, dispatch}) => {
    try {
      // DELETE /api/user/delete
      const res = await apiClient.delete('/user/delete');

      console.log('✅ 회원 탈퇴 성공:', res.data);

      // ✅ 로그아웃 효과: 사용자 정보 초기화 & 로컬 로그인 정보 제거
      dispatch(setUser(null));
      await deleteLoginInfo();

      return res.data;
    } catch (error) {
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        '알 수 없는 오류';

      console.error('❌ 회원 탈퇴 실패:', errorMsg);
      return rejectWithValue(errorMsg);
    }
  },
);
