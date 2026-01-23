// src/features/memory/store/categorySlice.js
import {createSlice} from '@reduxjs/toolkit';
import {fetchCategoryThunk, createCategoryThunk} from './categoryThunk';

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
    setTempCategoryList(state, action) {
      state.categoryList = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      // fetch
      .addCase(fetchCategoryThunk.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCategoryThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categoryList = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchCategoryThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? '카테고리 불러오기 실패';
      })

      // create
      .addCase(createCategoryThunk.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createCategoryThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) state.categoryList = [...state.categoryList, action.payload];
      })
      .addCase(createCategoryThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? '카테고리 생성 실패';
      });
  },
});

export const {clearCategoryError, setTempCategoryList} = categorySlice.actions;
export default categorySlice.reducer;
