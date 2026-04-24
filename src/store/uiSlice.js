// src/store/uiSlice.js
import {createSlice} from '@reduxjs/toolkit';
import {EMOTION_PICK_APP_EVENT_ID} from 'config/appEvents';
import {readEmotionPickAlertDismissFromMmkv} from 'utils/appEventDismissStorage';

export const BIO_LOCK_STORAGE_KEY = 'ui:bioLockEnabled';

const getInitialBioLockEnabled = () => {
  try {
    const {MMKV} = require('react-native-mmkv');
    const mmkv = new MMKV({id: 'kinover-redux-persist'});
    return mmkv.getString(BIO_LOCK_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

const initialState = {
  bioLockEnabled: getInitialBioLockEnabled(),
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
    setBioLockEnabled(state, action) {
      state.bioLockEnabled = !!action.payload;
    },
    setMarketingNotificationEnabled(state, action) {
      state.marketingNotificationEnabled = !!action.payload;
    },
    setEmotionPickAlertDismiss(state, action) {
      state.emotionPickAlertDismiss = action.payload;
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
  resetUi,
} = uiSlice.actions;
export default uiSlice.reducer;
