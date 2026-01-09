// src/screens/memory/store/memorySlice.js
import {createSlice} from '@reduxjs/toolkit';

const initialMemoryState = {
  memoryList: [],
  memoryId: '',
  date: '',
  familyId: 1,
  image: '',
  createdAt: '',
  loading: false,
  postsById: {},

  // ✅ UI 상태 (탭)
  ui: {
    selectedTab: 'feed', // 'post' | 'album'
  },

  error: null,
};

const memorySlice = createSlice({
  name: 'memory',
  initialState: initialMemoryState,
  reducers: {
    setMemoryList(state, action) {
      const list = action.payload || [];
      state.memoryList = [...list];

      // 🔁 postsById도 같이 채워 넣기
      list.forEach(post => {
        if (post?.postId) {
          state.postsById[post.postId] = post;
        }
      });
    },

    setMemoryLoading(state, action) {
      state.loading = action.payload;
    },

    setMemoryError(state, action) {
      state.error = action.payload;
    },

    setPostDetail(state, action) {
      const post = action.payload;
      if (post && post.postId) {
        state.postsById[post.postId] = post;
      }
    },

    // ✅ 탭 변경 액션
    setMemorySelectedTab(state, action) {
      const tab = action.payload;
      if (tab === 'feed' || tab === 'album') {
        state.ui.selectedTab = tab;
      }
    },
  },
});

export const {
  setMemoryList,
  setMemoryLoading,
  setMemoryError,
  setPostDetail,
  setMemorySelectedTab,
} = memorySlice.actions;

export default memorySlice.reducer;
