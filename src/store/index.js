// src/store/index.js
import {configureStore} from '@reduxjs/toolkit';
import {persistReducer, persistStore} from 'redux-persist';

import rootReducer from './rootReducer';
import {baseApi} from '../services/baseApi';
import 'features/moderation/services/moderationApi';
import mmkvStorage from 'utils/mmkvStorage';

const persistConfig = {
  key: 'root',
  storage: mmkvStorage,
  whitelist: ['ui'], // persist할 slice만 명시 (auth/실시간 데이터는 제외 후 서버에서 강제 새로고침)
 // rehydrate 직후: useAutoLogin에서 토큰 유효 시 fetchUser → fetchFamily → fetchChatRoomList 등으로 서버 강제 새로고침
  blacklist: [
    'login',  // 토큰 등 인증 정보
    'message', // 실시간 채팅 메시지
    'api',    // RTK Query 캐시 (앱 재시작 시 서버에서 새로 불러옴)
  ],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false, // redux-persist 때문에 끄는 게 일반적
    }).concat(baseApi.middleware), // RTK Query 캐시 생명주기 관리
});

export const persistor = persistStore(store);


export default store;

