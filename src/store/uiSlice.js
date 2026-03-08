// src/store/uiSlice.js
import {createSlice} from '@reduxjs/toolkit';

export const FONT_MODE = {
  NORMAL: 'NORMAL',
  LARGE: 'LARGE',
  EXTRA_LARGE: 'EXTRA_LARGE',
};

const initialState = {
  fontMode: FONT_MODE.NORMAL,
  bioLockEnabled: false, // 추가
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setFontMode(state, action) {
      const v = action.payload;

      if (v === FONT_MODE.EXTRA_LARGE) {
        state.fontMode = FONT_MODE.EXTRA_LARGE;
        return;
      }
      if (v === FONT_MODE.LARGE) {
        state.fontMode = FONT_MODE.LARGE;
        return;
      }
      state.fontMode = FONT_MODE.NORMAL;
    },
    setBioLockEnabled(state, action) {
      state.bioLockEnabled = !!action.payload;
    },
    /** 로그아웃/회원탈퇴 시 글씨 크기·생체잠금 초기화 */
    resetUi(state) {
      state.fontMode = FONT_MODE.NORMAL;
      state.bioLockEnabled = false;
    },
  },
});

export const {setFontMode, setBioLockEnabled, resetUi} = uiSlice.actions;
export default uiSlice.reducer;
