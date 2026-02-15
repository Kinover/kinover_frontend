/**
 * @fileoverview 접속 상태 관리 Slice
 * 
 * 온라인 사용자 목록을 관리합니다.
 * 
 * @deprecated 이 Slice는 familySlice로 통합되었습니다.
 * 온라인 사용자 정보는 familySlice의 onlineUserIds와 lastActiveMap을 사용하세요.
 */

import {createSlice} from '@reduxjs/toolkit';

// ==================== Initial State ====================

const initialState = {
  onlineUserIds: [],
};

// ==================== Slice ====================

const statusSlice = createSlice({
  name: 'status',
  initialState,
  reducers: {
    /**
     * 온라인 사용자 ID 목록 설정
     * @param {Object} state - 현재 상태
     * @param {Object} action - 액션 객체
     * @param {Array<string|number>} action.payload - 온라인 사용자 ID 배열
     */
    setOnlineUserIds: (state, action) => {
      state.onlineUserIds = Array.isArray(action.payload)
        ? [...action.payload]
        : [];
    },
  },
});

// ==================== Exports ====================

export const {setOnlineUserIds} = statusSlice.actions;
export default statusSlice.reducer;
