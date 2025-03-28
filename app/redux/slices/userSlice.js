// userSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialUserState = {
  userId: null,
  birth: null,
  phoneNumber: null,
  image: null,
  name: null,
  email: null,
  status: null,
  updatedAt: null,
  login: false,
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState: initialUserState,
  reducers: {
    setUser(state, action) {
      const { userId, birth, phoneNumber, image, name, email, status, updatedAt } = action.payload || {};
      state.userId = userId ?? state.userId;
      state.birth = birth ?? state.birth;
      state.phoneNumber = phoneNumber ?? state.phoneNumber;
      state.image = image ?? state.image;
      state.name = name ?? state.name;
      state.email = email ?? state.email;
      state.status = status ?? state.status;
      state.updatedAt = updatedAt ?? state.updatedAt;
    },
    setUserImage(state, action) {
      state.image = action.payload || state.image;
    },
    setUserLoading(state, action) {
      state.loading = action.payload;
    },
    setUserError(state, action) {
      state.error = action.payload;
    },
    setUserlogin(state) {
      state.login = true;
    },
    setUserlogout(state) {
      Object.assign(state, initialUserState);
    },
  },
});

export const {
  setUser,
  setUserImage,
  setUserLoading,
  setUserError,
  login,
  logout,
} = userSlice.actions;

export default userSlice.reducer;
