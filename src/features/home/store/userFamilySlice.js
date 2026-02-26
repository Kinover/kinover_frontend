/**
 * @fileoverview 가족 구성원 상태 관리 Slice
 * 
 * 가족 구성원 목록과 관련 상태를 관리합니다.
 */

import {createSlice} from '@reduxjs/toolkit';

// ==================== Initial State ====================

const initialState = {
  userFamily: [],
  familyUserList: [],
  loading: false,
  error: null,
};

// ==================== Slice ====================

const userFamilySlice = createSlice({
  name: 'userFamily',
  initialState,
  reducers: {
    /**
     * 사용자 가족 정보 설정
     * @param {Object} state - 현재 상태
     * @param {Object} action - 액션 객체
     * @param {Array} action.payload - 가족 정보 배열
     */
    setUserFamily(state, action) {
      const payload = action?.payload;
      state.userFamily = Array.isArray(payload) ? [...payload] : [];
    },

    /**
     * 가족 구성원 목록 설정
     * @param {Object} state - 현재 상태
     * @param {Object} action - 액션 객체
     * @param {Array} action.payload - 가족 구성원 배열
     */
    setFamilyUserList(state, action) {
      const payload = action?.payload;
      state.familyUserList = Array.isArray(payload) ? [...payload] : [];
    },

    /**
     * 로딩 상태 설정
     * @param {Object} state - 현재 상태
     * @param {Object} action - 액션 객체
     * @param {boolean} action.payload - 로딩 여부
     */
    setUserFamilyLoading(state, action) {
      state.loading = action.payload;
    },

    /**
     * 에러 상태 설정
     * @param {Object} state - 현재 상태
     * @param {Object} action - 액션 객체
     * @param {string|null} action.payload - 에러 메시지
     */
    setUserFamilyError(state, action) {
      state.error = action.payload;
    },

    /**
     * 가족 구성원 정보 업데이트
     * @param {Object} state - 현재 상태
     * @param {Object} action - 액션 객체
     * @param {Object} action.payload - 업데이트할 사용자 정보
     * @param {string|number} action.payload.userId - 사용자 ID
     */
    updateFamilyUser(state, action) {
      const updatedUser = action?.payload;
      if (!updatedUser?.userId) return;
      const list = state?.familyUserList ?? [];
      state.familyUserList = Array.isArray(list)
        ? list.map(user =>
            String(user?.userId) === String(updatedUser.userId)
              ? updatedUser
              : user,
          )
        : [];
    },
  },
});

// ==================== Exports ====================

export const {
  setUserFamily,
  setFamilyUserList,
  setUserFamilyLoading,
  setUserFamilyError,
  updateFamilyUser,
} = userFamilySlice.actions;

export default userFamilySlice.reducer;
