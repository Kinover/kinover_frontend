// userFamilySlice.js
import {createSlice} from '@reduxjs/toolkit';

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
      state.userFamily = [...action.payload];
    },
    setFamilyUserList(state, action) {
      state.familyUserList = [...action.payload];
    },
    setUserFamilyLoading(state, action) {
      state.loading = action.payload;
    },
    setUserFamilyError(state, action) {
      state.error = action.payload;
    },
    // ✅ 새로 추가
    updateFamilyUser(state, action) {
      const updatedUser = action.payload;
      state.familyUserList = state.familyUserList.map(user =>
        user.userId === updatedUser.userId ? updatedUser : user,
      );
    },
  },
});

export const {
  setUserFamily,
  setFamilyUserList,
  setUserFamilyLoading,
  setUserFamilyError,
  updateFamilyUser, // ✅ 이거 추가

} = userFamilySlice.actions;

export default userFamilySlice.reducer;
