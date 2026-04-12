// src/features/memory/store/categorySlice.js
import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  categoryList: [],
};

const categorySlice = createSlice({
  name: 'category',
  initialState,
  reducers: {
    clearCategoryError() {},
    setTempCategoryList(state, action) {
      state.categoryList = action.payload;
    },
    removeTemporaryCategoryById(state, action) {
      const id = String(action.payload ?? '');
      if (!id) return;
      state.categoryList = state.categoryList.filter(
        c => String(c.categoryId) !== id,
      );
    },
  },
});

export const {
  clearCategoryError,
  setTempCategoryList,
  removeTemporaryCategoryById,
} = categorySlice.actions;
export default categorySlice.reducer;
