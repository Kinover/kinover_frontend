// src/store/uiSlice.js
import {createSlice} from '@reduxjs/toolkit';
import {EMOTION_PICK_APP_EVENT_ID} from 'config/appEvents';
import {readEmotionPickAlertDismissFromMmkv} from 'utils/appEventDismissStorage';
import {mmkvGetStringSync} from 'utils/mmkvStorage';

export const BIO_LOCK_STORAGE_KEY = 'ui:bioLockEnabled';
/** redux-persist와 별도로 기록 — 재실행·rehydrate 머지보다 우선해 테마가 유지되도록 */
export const UI_DARK_MODE_STORAGE_KEY = 'ui:isDarkMode';

const getInitialBioLockEnabled = () => {
  return mmkvGetStringSync(BIO_LOCK_STORAGE_KEY) === 'true';
};

/** 키 없음이면 `null` — REHYDRATE 직후 persist 스냅샷만으로 MMKV 선호를 덮어쓰지 않기 위함 */
export function getDarkModeMmkvPreference() {
  const v = mmkvGetStringSync(UI_DARK_MODE_STORAGE_KEY);
  if (v === 'true') {
    return true;
  }
  if (v === 'false') {
    return false;
  }
  return null;
}

export function readDarkModeFromMmkv() {
  return getDarkModeMmkvPreference() === true;
}

const initialState = {
  bioLockEnabled: getInitialBioLockEnabled(),
  marketingNotificationEnabled: true,
  /** 감정 유도 AppAlert — persist(ui) + 앱 재실행 후에도 유지 */
  emotionPickAlertDismiss: readEmotionPickAlertDismissFromMmkv(
    EMOTION_PICK_APP_EVENT_ID,
  ),
  isDarkMode: readDarkModeFromMmkv(),
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setBioLockEnabled(state, action) {
      state.bioLockEnabled = !!action.payload;
    },
    setMarketingNotificationEnabled(state, action) {
      state.marketingNotificationEnabled = !!action.payload;
    },
    setEmotionPickAlertDismiss(state, action) {
      state.emotionPickAlertDismiss = action.payload;
    },
    toggleDarkMode(state) {
      state.isDarkMode = !state.isDarkMode;
    },
    setDarkMode(state, action) {
      state.isDarkMode = !!action.payload;
    },
    /** 로그아웃/회원탈퇴 시 생체잠금·마케팅 알림 초기화 */
    resetUi(state) {
      state.bioLockEnabled = false;
      state.marketingNotificationEnabled = true;
      state.emotionPickAlertDismiss = null;
    },
  },
});

export const {
  setBioLockEnabled,
  setMarketingNotificationEnabled,
  setEmotionPickAlertDismiss,
  toggleDarkMode,
  setDarkMode,
  resetUi,
} = uiSlice.actions;
export default uiSlice.reducer;
