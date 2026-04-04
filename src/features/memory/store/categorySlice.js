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
  },
});

export const {clearCategoryError, setTempCategoryList} = categorySlice.actions;
export default categorySlice.reducer;
