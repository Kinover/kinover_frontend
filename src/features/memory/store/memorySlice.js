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

 // 상세 캐시 (postId -> post)
  postsById: {},

 // UI 상태 (탭) : 'feed' | 'album'
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
      const list = action?.payload ?? [];
      state.memoryList = Array.isArray(list) ? [...list] : [];
      state.postsById = {};
      state.memoryList.forEach(post => {
        if (post?.postId != null) {
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
      const post = action?.payload;
      if (!post?.postId) return;
      if (!state.postsById) state.postsById = {};
      state.postsById[String(post.postId)] = post;
    },

    setMemorySelectedTab(state, action) {
      const tab = action?.payload;
      if (tab !== 'feed' && tab !== 'album') return;
      if (!state.ui) state.ui = {selectedTab: 'feed'};
      state.ui.selectedTab = tab;
    },

    resetMemoryState(state) {
      state.memoryList = [];
      state.postsById = {};
      state.loading = false;
      state.error = null;
      if (!state.ui) state.ui = {selectedTab: 'feed'};
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
