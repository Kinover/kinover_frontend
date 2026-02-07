// src/features/home/store/familySlice.js
import {createSlice} from '@reduxjs/toolkit';

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

const familySlice = createSlice({
  name: 'family',
  initialState: initialFamilyState,
  reducers: {
    setFamily(state, action) {
      const payload = action.payload || {};

      const {familyId, name, notice, createdAt, updatedAt, relationship} =
        payload;

      state.familyId = familyId ?? state.familyId;
      state.name = name ?? state.name;
      state.notice = notice ?? state.notice;
      state.createdAt = createdAt ?? state.createdAt;
      state.updatedAt = updatedAt ?? state.updatedAt;

      // relationship는 서버가 enum을 주면 맵핑, 이미 한글로 주면 그대로 유지
      state.relationship =
        relationshipMap[relationship] ?? relationship ?? state.relationship;
    },

    setFamilyLoading(state, action) {
      state.loading = !!action.payload;
    },

    setFamilyError(state, action) {
      state.error = action.payload ?? null;
    },

    setOnlineUserIds(state, action) {
      state.onlineUserIds = Array.isArray(action.payload)
        ? [...action.payload]
        : [];
    },

    setLastActiveMap(state, action) {
      state.lastActiveMap = action.payload || {};
    },

    // (선택) 로그아웃/초기화 등에 쓰고 싶으면
    resetFamilyState() {
      return {...initialFamilyState};
    },
  },
});

export const {
  setFamily,
  setFamilyLoading,
  setFamilyError,
  setOnlineUserIds,
  setLastActiveMap,
  resetFamilyState,
} = familySlice.actions;

export default familySlice.reducer;
