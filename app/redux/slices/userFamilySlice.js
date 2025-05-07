// userFamilySlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  userFamily: [],
  familyUserList: [],
  loading: false,
  error: null,
};

const userFamilySlice = createSlice({
  name: 'userFamily',
  initialState,
  reducers: {
    setUserFamily(state, action) {
      state.userFamily = action.payload;
    },
    setFamilyUserList(state, action) {
      state.familyUserList = action.payload;
    },
    setUserFamilyLoading(state, action) {
      state.loading = action.payload;
    },
    setUserFamilyError(state, action) {
      state.error = action.payload;
    },
  },
});

export const {
  setUserFamily,
  setFamilyUserList,
  setUserFamilyLoading,
  setUserFamilyError,
} = userFamilySlice.actions;

export default userFamilySlice.reducer;
