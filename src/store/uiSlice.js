// src/store/uiSlice.js
import {createSlice} from '@reduxjs/toolkit';
import {EMOTION_PICK_APP_EVENT_ID} from 'config/appEvents';
import {readEmotionPickAlertDismissFromMmkv} from 'utils/appEventDismissStorage';

export const FONT_MODE = {
  NORMAL: 'NORMAL',
  LARGE: 'LARGE',
  EXTRA_LARGE: 'EXTRA_LARGE',
};

const FONT_MODE_STORAGE_KEY = 'ui:fontMode';

const getInitialFontMode = () => {
  try {
    const {MMKV} = require('react-native-mmkv');
    const mmkv = new MMKV({id: 'kinover-redux-persist'});
    const saved = mmkv.getString(FONT_MODE_STORAGE_KEY);
    if (saved === FONT_MODE.EXTRA_LARGE) return FONT_MODE.EXTRA_LARGE;
    if (saved === FONT_MODE.LARGE) return FONT_MODE.LARGE;
    if (saved === FONT_MODE.NORMAL) return FONT_MODE.NORMAL;
  } catch {
    null;
  }
  return FONT_MODE.NORMAL;
};

const initialState = {
  fontMode: getInitialFontMode(),
  bioLockEnabled: false,
  marketingNotificationEnabled: true,
  /** 감정 유도 AppAlert — persist(ui) + 앱 재실행 후에도 유지 */
  emotionPickAlertDismiss: readEmotionPickAlertDismissFromMmkv(
    EMOTION_PICK_APP_EVENT_ID,
  ),
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
    setMarketingNotificationEnabled(state, action) {
      state.marketingNotificationEnabled = !!action.payload;
    },
    setEmotionPickAlertDismiss(state, action) {
      state.emotionPickAlertDismiss = action.payload;
    },
    /** 로그아웃/회원탈퇴 시 글씨 크기·생체잠금·마케팅 알림 초기화 */
    resetUi(state) {
      state.fontMode = FONT_MODE.NORMAL;
      state.bioLockEnabled = false;
      state.marketingNotificationEnabled = true;
      state.emotionPickAlertDismiss = null;
    },
  },
});

export const {
  setFontMode,
  setBioLockEnabled,
  setMarketingNotificationEnabled,
  setEmotionPickAlertDismiss,
  resetUi,
} = uiSlice.actions;
export default uiSlice.reducer;
