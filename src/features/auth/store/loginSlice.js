// src/features/auth/store/loginSlice.js
import {createSlice} from '@reduxjs/toolkit';

const initialLoginState = {
  loading: false,
  error: null,

  // ✅ "서버 인증(토큰)" 관점 로그인 여부
  isLoggedIn: false,

  // ✅ "userinfo/familyId까지 확인 완료" 여부 (라우팅 확정 가능)
  authChecked: false,
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

    // ✅ 로그인 성공 = "토큰 인증 성공"
    //    (userinfo/familyId 확인 전이므로 authChecked는 여기서 건드리지 않는 게 안정)
    setLoginSuccess(state) {
      state.isLoggedIn = true;
      state.error = null;
      // state.authChecked = false; // 명시적으로 두고 싶으면 주석 해제
    },

    // ✅ 로그아웃 = 전부 초기화(라우팅 판단 흔들림 방지)
    setLogout(state) {
      state.isLoggedIn = false;
      state.authChecked = false;
      state.error = null;
    },

    // ✅ userinfo까지 확인 완료되면 true
    setAuthChecked(state, action) {
      state.authChecked = !!action.payload;
    },

    // (선택) authChecked만 초기화하고 싶을 때 쓰는 액션도 가능
    // resetAuthChecked(state) {
    //   state.authChecked = false;
    // },
  },
});

export const {
  setLoginLoading,
  setLoginError,
  setLoginSuccess,
  setLogout,
  setAuthChecked,
} = loginSlice.actions;

export default loginSlice.reducer;
