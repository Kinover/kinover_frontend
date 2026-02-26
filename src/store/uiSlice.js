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
  },
});

export const {setFontMode, setBioLockEnabled} = uiSlice.actions;
export default uiSlice.reducer;
