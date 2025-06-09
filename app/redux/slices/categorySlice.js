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
    // ✅ 에러 초기화
    clearCategoryError(state) {
      state.error = null;
    },

    // ✅ 임시 카테고리 리스트 상태에 반영
    setTempCategoryList(state, action) {
      state.categoryList = action.payload;
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
        state.categoryList.push(action.payload);
      })
      .addCase(createCategoryThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

// ✅ 액션과 리듀서 export
export const { clearCategoryError, setTempCategoryList } = categorySlice.actions;
export default categorySlice.reducer;
