// redux/slices/commentSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  commentList: [],
  isLoading: false,
  error: null,
};

const commentSlice = createSlice({
  name: 'comment',
  initialState,
  reducers: {
    setCommentList: (state, action) => {
      state.commentList = action.payload;
      state.error = null;
    },
    setCommentLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setCommentError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  setCommentList,
  setCommentLoading,
  setCommentError,
} = commentSlice.actions;

export default commentSlice.reducer;
