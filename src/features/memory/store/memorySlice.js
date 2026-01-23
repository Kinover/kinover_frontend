// src/screens/memory/store/memorySlice.js
import {createSlice} from '@reduxjs/toolkit';

const initialMemoryState = {
  memoryList: [],
  memoryId: '',
  date: '',
  familyId: null,
  image: '',
  createdAt: '',
  loading: false,

  // ✅ 상세 캐시 (postId -> post)
  postsById: {},

  // ✅ UI 상태 (탭) : 'feed' | 'album'
  ui: {
    selectedTab: 'feed',
  },

  error: null,
};

const memorySlice = createSlice({
  name: 'memory',
  initialState: initialMemoryState,
  reducers: {
    setMemoryList(state, action) {
      const list = action.payload || [];
      state.memoryList = Array.isArray(list) ? [...list] : [];

      // ✅ 새 목록 기준으로 postsById도 "최소한 덮어쓰기" 해줌
      // - 기존 캐시 유지가 필요하면 아래 라인 주석 처리 가능
      // - 가족 바뀌거나 필터 바뀔 때 stale 데이터 방지하려면 reset이 안전
      state.postsById = {};

      state.memoryList.forEach(post => {
        if (post?.postId) {
          state.postsById[String(post.postId)] = post;
        }
      });
    },

    setMemoryLoading(state, action) {
      state.loading = !!action.payload;
    },

    setMemoryError(state, action) {
      state.error = action.payload ?? null;
    },

    setPostDetail(state, action) {
      const post = action.payload;
      if (post?.postId) {
        state.postsById[String(post.postId)] = post;
      }
    },

    // ✅ 탭 변경 액션
    setMemorySelectedTab(state, action) {
      const tab = action.payload;
      if (tab === 'feed' || tab === 'album') {
        state.ui.selectedTab = tab;
      }
    },

    // (옵션) 캐시/리스트 초기화가 필요할 때 쓰기 좋음
    resetMemoryState(state) {
      state.memoryList = [];
      state.postsById = {};
      state.loading = false;
      state.error = null;
      state.ui.selectedTab = 'feed';
    },
  },
});

export const {
  setMemoryList,
  setMemoryLoading,
  setMemoryError,
  setPostDetail,
  setMemorySelectedTab,
  resetMemoryState,
} = memorySlice.actions;

export default memorySlice.reducer;
