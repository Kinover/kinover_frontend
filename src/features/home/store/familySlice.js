/**
 * @fileoverview 가족 상태 관리 Slice
 * 
 * 가족 정보, 접속 상태, 관계 단계 등을 관리합니다.
 */

import {createSlice} from '@reduxjs/toolkit';

// ==================== Constants ====================

/**
 * 관계 단계 enum → 한글 매핑
 */
const relationshipMap = {
  AWKWARD_START: '어색한 사이',
  GETTING_TO_KNOW: '알아가는 사이',
  GENTLE_APPROACH: '다가가는 사이',
  COMFORTABLE_DISTANCE: '편안한 사이',
  SHARING_HEARTS: '진심을 나누는 사이',
  SOLID_BOND: '단단한 사이',
  FAMILY_OF_TRUST: '믿음의 사이',
  UNIFIED_HEARTS: '하나된 사이',
};

// ==================== Initial State ====================

const initialFamilyState = {
  familyId: null,
  name: null,
  notice: null,
  createdAt: null,
  updatedAt: null,
  relationship: null,

  loading: false,
  error: null,

  onlineUserIds: [],
  lastActiveMap: {},
};

// ==================== Slice ====================

const familySlice = createSlice({
  name: 'family',
  initialState: initialFamilyState,
  reducers: {
    /**
     * 가족 정보 설정
     * @param {Object} state - 현재 상태
     * @param {Object} action - 액션 객체
     * @param {Object} action.payload - 가족 정보 객체
     * @param {string|number} action.payload.familyId - 가족 ID
     * @param {string} action.payload.name - 가족 이름
     * @param {string} action.payload.notice - 공지사항
     * @param {string} action.payload.relationship - 관계 단계 (enum 또는 한글)
     */
    setFamily(state, action) {
      const payload = action.payload || {};

      const {familyId, name, notice, createdAt, updatedAt, relationship} =
        payload;

      state.familyId = familyId ?? state.familyId;
      state.name = name ?? state.name;
      state.notice = notice ?? state.notice;
      state.createdAt = createdAt ?? state.createdAt;
      state.updatedAt = updatedAt ?? state.updatedAt;

      // relationship: 서버가 enum을 주면 한글로 매핑, 이미 한글이면 그대로 유지
      state.relationship =
        relationshipMap[relationship] ?? relationship ?? state.relationship;
    },

    /**
     * 로딩 상태 설정
     * @param {Object} state - 현재 상태
     * @param {Object} action - 액션 객체
     * @param {boolean} action.payload - 로딩 여부
     */
    setFamilyLoading(state, action) {
      state.loading = !!action.payload;
    },

    /**
     * 에러 상태 설정
     * @param {Object} state - 현재 상태
     * @param {Object} action - 액션 객체
     * @param {string|null} action.payload - 에러 메시지
     */
    setFamilyError(state, action) {
      state.error = action.payload ?? null;
    },

    /**
     * 온라인 사용자 ID 목록 설정
     * @param {Object} state - 현재 상태
     * @param {Object} action - 액션 객체
     * @param {Array<string|number>} action.payload - 온라인 사용자 ID 배열
     */
    setOnlineUserIds(state, action) {
      state.onlineUserIds = Array.isArray(action.payload)
        ? [...action.payload]
        : [];
    },

    /**
     * 사용자별 마지막 접속 시간 맵 설정
     * @param {Object} state - 현재 상태
     * @param {Object} action - 액션 객체
     * @param {Object<string, string>} action.payload - 사용자 ID → 마지막 접속 시간 맵
     */
    setLastActiveMap(state, action) {
      state.lastActiveMap = action.payload || {};
    },

    /**
     * 가족 상태 초기화 (로그아웃/초기화용)
     * @returns {Object} 초기 상태 객체
     */
    resetFamilyState() {
      return {...initialFamilyState};
    },
  },
});

// ==================== Exports ====================

export const {
  setFamily,
  setFamilyLoading,
  setFamilyError,
  setOnlineUserIds,
  setLastActiveMap,
  resetFamilyState,
} = familySlice.actions;

export default familySlice.reducer;
