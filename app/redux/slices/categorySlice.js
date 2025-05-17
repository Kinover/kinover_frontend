import { createSlice } from '@reduxjs/toolkit';
import { fetchCategoryThunk, createCategoryThunk } from '../thunk/categoryThunk';

const initialState = {
  categoryList: [],
  isLoading: false,
  error: null,
};

const categorySlice = createSlice({
  name: 'category',
  initialState,
  reducers: {
    clearCategoryError(state) {
      state.error = null;
    },
  },
  extraReducers: builder => {
    // ✅ 카테고리 불러오기
    builder
      .addCase(fetchCategoryThunk.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCategoryThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categoryList = action.payload;
      })
      .addCase(fetchCategoryThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // ✅ 카테고리 생성
    builder
      .addCase(createCategoryThunk.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createCategoryThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categoryList.push(action.payload); // 새 항목 추가
      })
      .addCase(createCategoryThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCategoryError } = categorySlice.actions;
export default categorySlice.reducer;
