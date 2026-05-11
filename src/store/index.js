// src/store/index.js
import {configureStore} from '@reduxjs/toolkit';
import {persistReducer, persistStore, REHYDRATE} from 'redux-persist';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';

import rootReducer from './rootReducer';
import {baseApi} from '../services/baseApi';
import 'features/moderation/services/moderationApi';
import mmkvStorage, {mmkvGetStringSync, mmkvSetStringSync} from 'utils/mmkvStorage';
import {EMOTION_PICK_APP_EVENT_ID} from 'config/appEvents';
import {readEmotionPickAlertDismissFromMmkv} from 'utils/appEventDismissStorage';
import {
  getDarkModeMmkvPreference,
  setDarkMode,
  UI_DARK_MODE_STORAGE_KEY,
} from './uiSlice';

/**
 * autoMergeLevel2 직후 `ui.isDarkMode`를 MMKV로 덮어씀.
 * persist 스냅샷이 오래된 false를 넣어도 rehydrate 한 번에 Redux 상태가 확정되도록 함.
 */
function kinoverPersistReconciler(inboundState, originalState, reducedState, config) {
  const merged = autoMergeLevel2(
    inboundState,
    originalState,
    reducedState,
    config,
  );
  try {
    const v = mmkvGetStringSync(UI_DARK_MODE_STORAGE_KEY);
    if (
      (v === 'true' || v === 'false') &&
      merged &&
      typeof merged === 'object' &&
      merged.ui &&
      typeof merged.ui === 'object'
    ) {
      return {
        ...merged,
        ui: {
          ...merged.ui,
          isDarkMode: v === 'true',
        },
      };
    }
  } catch {
    null;
  }
  return merged;
}

const persistConfig = {
  key: 'root',
  storage: mmkvStorage,
  /** ui 서브트리를 shallow merge — autoMergeLevel1은 ui 전체를 inbound로 덮어 새 필드(감정 모달 dismiss 등)가 사라짐 */
  stateReconciler: kinoverPersistReconciler,
  version: 1,
  migrate: async state => {
    let result = state;

    // bioLockEnabled: MMKV 직접 키(ui:bioLockEnabled)를 redux-persist 복원값보다 우선 적용.
    // redux-persist flush 타이밍 문제로 저장이 누락돼도 직접 키는 항상 정확하게 기록됨.
    try {
      if (result?.ui) {
        const bioVal = mmkvGetStringSync('ui:bioLockEnabled');
        if (bioVal !== undefined && bioVal !== null) {
          result = {
            ...result,
            ui: {...result.ui, bioLockEnabled: bioVal === 'true'},
          };
        }
        const darkVal = mmkvGetStringSync(UI_DARK_MODE_STORAGE_KEY);
        if (darkVal === 'true' || darkVal === 'false') {
          result = {
            ...result,
            ui: {...result.ui, isDarkMode: darkVal === 'true'},
          };
        } else if (result?.ui?.isDarkMode === true) {
          try {
            mmkvSetStringSync(UI_DARK_MODE_STORAGE_KEY, 'true');
          } catch {
            null;
          }
        }
      }
    } catch {
      null;
    }

    try {
      if (result?.ui && result.ui.emotionPickAlertDismiss == null) {
        const fromMmkv = readEmotionPickAlertDismissFromMmkv(
          EMOTION_PICK_APP_EVENT_ID,
        );
        if (fromMmkv) {
          return {
            ...result,
            ui: {...result.ui, emotionPickAlertDismiss: fromMmkv},
          };
        }
      }
    } catch {
      null;
    }

    return result;
  },
  whitelist: ['ui'], // persist할 slice만 명시 (auth/실시간 데이터는 제외 후 서버에서 강제 새로고침)
 // rehydrate 직후: useAutoLogin에서 토큰 유효 시 fetchUser → fetchFamily → fetchChatRoomList 등으로 서버 강제 새로고침
  blacklist: [
    'login',  // 토큰 등 인증 정보
    'message', // 실시간 채팅 메시지
    'api',    // RTK Query 캐시 (앱 재시작 시 서버에서 새로 불러옴)
  ],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

/**
 * - 토글 시 MMKV 즉시 반영
 * - REHYDRATE 후: persist 스냅샷이 오래되어 isDarkMode가 false로 머지돼도, MMKV에 'true'가 있으면 복구
 *   (앱 kill 직전 persist flush 전에 죽는 경우 등)
 */
const uiDarkModeMmkvMiddleware = store => next => action => {
  if (action.type === REHYDRATE && action.key === persistConfig.key) {
    const result = next(action);
    const pref = getDarkModeMmkvPreference();
    if (pref !== null) {
      const fromStore = !!store.getState()?.ui?.isDarkMode;
      if (fromStore !== pref) {
        store.dispatch(setDarkMode(pref));
      }
    }
    return result;
  }

  const prevDark = !!store.getState()?.ui?.isDarkMode;
  const result = next(action);
  if (
    action.type === 'ui/toggleDarkMode' ||
    action.type === 'ui/setDarkMode'
  ) {
    const nextDark = !!store.getState()?.ui?.isDarkMode;
    if (prevDark !== nextDark) {
      try {
        mmkvSetStringSync(
          UI_DARK_MODE_STORAGE_KEY,
          nextDark ? 'true' : 'false',
        );
      } catch {
        null;
      }
    }
  }
  return result;
};

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false, // redux-persist 때문에 끄는 게 일반적
    })
      .concat(uiDarkModeMmkvMiddleware)
      .concat(baseApi.middleware), // RTK Query 캐시 생명주기 관리
});

export const persistor = persistStore(store);


export default store;

