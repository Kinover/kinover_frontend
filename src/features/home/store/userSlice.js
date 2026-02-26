/**
 * @fileoverview 사용자 상태 관리 Slice
 * 
 * 현재 로그인한 사용자의 정보와 상태를 관리합니다.
 */

import {createSlice} from '@reduxjs/toolkit';

// ==================== Initial State ====================

export const initialUserState = {
  userId: null,
  birth: null,
  phoneNumber: null,
  image: null,
  name: null,
  email: null,
  status: null,
  updatedAt: null,
  login: false,
  loading: false,
  error: null,
  emotion: null,
  emotionUpdatedAt: null,
  trait: null,
  familyId: null,
};

// ==================== Slice ====================

const userSlice = createSlice({
  name: 'user',
  initialState: initialUserState,
  reducers: {
    /**
     * 사용자 정보 설정
     * payload가 null/undefined면 완전 초기화
     * 
     * @param {Object} state - 현재 상태
     * @param {Object} action - 액션 객체
     * @param {Object|null} action.payload - 사용자 정보 객체
     */
    setUser(state, action) {
      const payload = action.payload;

      if (!payload) {
        Object.assign(state, initialUserState);
        return;
      }

      const {
        userId,
        birth,
        phoneNumber,
        image,
        name,
        email,
        status,
        updatedAt,
        login,
        emotion,
        trait,
        emotionUpdatedAt,
        familyId,
      } = payload;

      state.userId = userId ?? state.userId;
      state.birth = birth ?? state.birth;
      state.phoneNumber = phoneNumber ?? state.phoneNumber;
      state.image = image ?? state.image;
      state.name = name ?? state.name;
      state.email = email ?? state.email;
      state.status = status ?? state.status;
      state.updatedAt = updatedAt ?? state.updatedAt;
      state.login = typeof login === 'boolean' ? login : state.login;
      state.emotion = emotion ?? state.emotion;
      state.trait = trait ?? state.trait;
      state.emotionUpdatedAt = emotionUpdatedAt ?? state.emotionUpdatedAt;
      state.familyId = familyId ?? state.familyId;
    },

    /**
     * 사용자 상태 초기화 (탈퇴/강제 로그아웃용)
     * @param {Object} state - 현재 상태
     */
    resetUser(state) {
      Object.assign(state, initialUserState);
    },

    /**
     * 사용자 프로필 이미지 설정
     * @param {Object} state - 현재 상태
     * @param {Object} action - 액션 객체
     * @param {string|null} action.payload - 이미지 URL
     */
    setUserImage(state, action) {
      state.image = action.payload || state.image;
    },

    /**
     * 사용자 정보 부분 업데이트
     * 이미지가 null이거나 빈 문자열인 경우 기존 이미지 유지
     * 
     * @param {Object} state - 현재 상태
     * @param {Object} action - 액션 객체
     * @param {Object} action.payload - 업데이트할 사용자 정보
     * @returns {Object} 업데이트된 상태
     */
    updateUser(state, action) {
      const next = {...state, ...action.payload};

      if (
        Object.prototype.hasOwnProperty.call(action.payload, 'image') &&
        (action.payload.image === null || action.payload.image === '')
      ) {
        next.image = state.image;
      }

      return next;
    },

    /**
     * 로딩 상태 설정
     * @param {Object} state - 현재 상태
     * @param {Object} action - 액션 객체
     * @param {boolean} action.payload - 로딩 여부
     */
    setUserLoading(state, action) {
      state.loading = action.payload;
    },

    /**
     * 에러 상태 설정
     * @param {Object} state - 현재 상태
     * @param {Object} action - 액션 객체
     * @param {string|null} action.payload - 에러 메시지
     */
    setUserError(state, action) {
      state.error = action.payload;
    },

    /**
     * 로그인 상태 설정
     * @param {Object} state - 현재 상태
     */
    setUserlogin(state) {
      state.login = true;
    },

    /**
     * 로그아웃 상태 설정 (상태 초기화)
     * @param {Object} state - 현재 상태
     */
    setUserlogout(state) {
      Object.assign(state, initialUserState);
    },
  },
});

// ==================== Exports ====================

export const {
  setUser,
  resetUser,
  setUserImage,
  setUserLoading,
  setUserError,
  setUserlogin,
  setUserlogout,
  updateUser,
} = userSlice.actions;

export default userSlice.reducer;
