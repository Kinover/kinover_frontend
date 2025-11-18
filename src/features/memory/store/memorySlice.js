// memorySlice.js
import {createSlice} from '@reduxjs/toolkit';

const initialMemoryState = {
  memoryList: [],
  memoryId: '',
  date: '',
  familyId: 1,
  image: '',
  createdAt: '',
  loading: false,
  postsById: {}, // ✅ 여기 추가

  error: null,
};

const memorySlice = createSlice({
  name: 'memory',
  initialState: initialMemoryState,
  reducers: {
    setMemoryList(state, action) {
      const list = action.payload;
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
    // ⭐ 새로 추가된 리듀서 ⭐
    setPostDetail: (state, action) => {
      const post = action.payload;
      if (post && post.postId) {
        // Post 객체에 'postId' 필드가 있다고 가정
        state.postsById[post.postId] = post;
      }
    },
  },
});

export const {setMemoryList, setMemoryLoading, setMemoryError, setPostDetail} =
  memorySlice.actions;
export default memorySlice.reducer;
