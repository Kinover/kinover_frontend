// loginSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialLoginState = {
  loading: false,
  error: null,
  isLoggedIn: false,
};

const loginSlice = createSlice({
  name: 'login',
  initialState: initialLoginState,
  reducers: {
    setLoginLoading(state, action) {
      state.loading = action.payload;
    },
    setLoginError(state, action) {
      state.error = action.payload;
    },
    setLoginSuccess(state) {
      state.isLoggedIn = true;
      state.error = null;
    },
    setLogout(state) {
      state.isLoggedIn = false;
    },
  },
});



export const {
  setLoginLoading,
  setLoginError,
  setLoginSuccess,
  setLogout,
} = loginSlice.actions;

export default loginSlice.reducer;
