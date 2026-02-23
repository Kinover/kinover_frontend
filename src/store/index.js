// src/store/index.js
import {configureStore} from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {persistReducer, persistStore} from 'redux-persist';

import rootReducer from './rootReducer';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['ui'], // ✅ persist할 slice만 명시
  // ✅ 보안·실시간·일시 UI는 저장 제외 (나중에 whitelist 확장 시 참고)
  blacklist: [
    'login', // 토큰 등 인증 정보
    'message', // 실시간 채팅 메시지
    // 필요 시 일시적 UI 상태 slice 추가
  ],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false, // ✅ redux-persist 때문에 끄는 게 일반적
    }),
});

export const persistor = persistStore(store);


// ✅ 기존 코드 호환(기존처럼 default import 가능)
export default store;

