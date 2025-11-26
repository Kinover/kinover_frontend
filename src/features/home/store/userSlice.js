// userSlice.js
import {createSlice} from '@reduxjs/toolkit';

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
  emotionUpdatedAt: null,
  trait: null,
  familyId: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState: initialUserState,
  reducers: {
    setUser(state, action) {
      const {
        userId,
        birth,
        phoneNumber,
        image,
        name,
        email,
        emotion,
        trait,
        emotionUpdatedAt,
        familyId,
      } = action.payload || {};
      state.userId = userId ?? state.userId;
      state.birth = birth ?? state.birth;
      state.phoneNumber = phoneNumber ?? state.phoneNumber;
      state.image = image ?? state.image;
      state.name = name ?? state.name;
      state.email = email ?? state.email;
      state.emotion = emotion ?? state.emotion;
      state.trait = trait ?? state.trait;
      state.emotionUpdatedAt = emotionUpdatedAt ?? state.emotionUpdatedAt;
      state.familyId=familyId??state.familyId;
    },
    setUserImage(state, action) {
      state.image = action.payload || state.image;
    },
    updateUser: (state, action) => {
      return {
        ...state,
        ...action.payload, // 이름, 특징, 이미지 등 덮어쓰기
      };
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
  setUserlogin,
  setUserlogout,
  updateUser,
} = userSlice.actions;

export default userSlice.reducer;
