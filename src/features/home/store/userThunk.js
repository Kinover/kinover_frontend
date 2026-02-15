/**
 * @fileoverview 사용자 관련 비동기 액션 Thunk
 * 
 * 사용자 정보 조회, 수정, 삭제 등의 비동기 로직을 관리합니다.
 */

import {createAsyncThunk} from '@reduxjs/toolkit';
import {apiClient} from '../../../utils/apiClient';
import {deleteLoginInfo} from '../../../utils/storage';
import {
  setUser,
  resetUser,
  setUserLoading,
  setUserError,
  updateUser,
} from './userSlice';
import {updateFamilyUser} from './userFamilySlice';

// ==================== Utils ====================

/**
 * 에러 메시지 추출 헬퍼
 * @param {Error} error - 에러 객체
 * @param {string} defaultMsg - 기본 에러 메시지
 * @returns {string} 에러 메시지
 */
const extractErrorMessage = (error, defaultMsg) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data ||
    error?.message ||
    defaultMsg
  );
};

/**
 * 현재 사용자 ID 추출
 * @param {Function} getState - Redux getState 함수
 * @returns {string|number|null} 사용자 ID
 */
const getCurrentUserId = getState => {
  const stateUser = getState()?.user;
  return stateUser?.userId ?? stateUser?.user?.userId ?? null;
};

// ==================== Thunks ====================

/**
 * 사용자 정보 조회
 * 
 * @returns {Function} Redux thunk 함수
 * @returns {Promise<Object>} 사용자 정보 객체
 * 
 * @example
 * dispatch(fetchUserThunk()).then(user => console.log(user));
 */
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

      // Redux store 업데이트
      dispatch(setUser(res.data));

      // 호출부에서 사용할 수 있도록 DTO 반환
      return res.data;
    } catch (error) {
      const msg = extractErrorMessage(error, '유저 정보 조회 실패');

      dispatch(setUserError(msg));
      return rejectWithValue(msg);
    } finally {
      dispatch(setUserLoading(false));
    }
  },
);

/**
 * 사용자 정보 수정
 * 
 * @param {Object} updatedUser - 수정할 사용자 정보
 * @param {string|number} updatedUser.userId - 사용자 ID
 * @param {string} [updatedUser.name] - 이름
 * @param {string} [updatedUser.emotion] - 감정
 * @param {string} [updatedUser.trait] - 특성
 * @returns {Function} Redux thunk 함수
 * 
 * @example
 * dispatch(modifyUserThunk({
 *   userId: 'user-1',
 *   emotion: 'HAPPY',
 *   trait: '친절함'
 * }));
 */
export const modifyUserThunk = updatedUser => {
  return async (dispatch, getState) => {
    dispatch(setUserLoading(true));
    try {
      const res = await apiClient.post('/user/modify', updatedUser, {
        headers: {'Content-Type': 'application/json'},
      });

      // 본인 정보 수정인 경우 본인 상태도 업데이트
      const currentUserId = getCurrentUserId(getState);

      if (
        updatedUser?.userId != null &&
        String(updatedUser.userId) === String(currentUserId)
      ) {
        dispatch(updateUser(res.data));
      } else {
        // 가족 구성원 정보 수정인 경우
        dispatch(updateFamilyUser(res.data));
      }

      console.log('✅ 프로필 수정 완료:', res.data);
    } catch (error) {
      const msg = extractErrorMessage(error, '프로필 수정 실패');

      console.error('❌ 프로필 수정 실패:', msg);
      dispatch(setUserError(msg));
    } finally {
      dispatch(setUserLoading(false));
    }
  };
};

/**
 * 사용자 삭제 (회원 탈퇴)
 * 
 * @returns {Function} Redux thunk 함수
 * @returns {Promise<Object>} 삭제 결과 객체
 * 
 * @example
 * dispatch(deleteUserThunk()).then(() => {
 *   // 탈퇴 완료 처리
 * });
 */
export const deleteUserThunk = createAsyncThunk(
  'user/deleteUser',
  async (_, {rejectWithValue, dispatch}) => {
    try {
      const res = await apiClient.delete('/user/delete');

      console.log('✅ 회원 탈퇴 성공:', res.data);

      // 사용자 상태 완전 초기화
      dispatch(resetUser());
      await deleteLoginInfo();

      return res.data;
    } catch (error) {
      const errorMsg = extractErrorMessage(error, '알 수 없는 오류');

      console.error('❌ 회원 탈퇴 실패:', errorMsg);
      return rejectWithValue(errorMsg);
    }
  },
);
