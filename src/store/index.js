// src/store/index.js
import {configureStore} from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {persistReducer, persistStore} from 'redux-persist';

import rootReducer from './rootReducer';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['ui'], // ✅ 글씨 모드 저장할 slice 이름
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

