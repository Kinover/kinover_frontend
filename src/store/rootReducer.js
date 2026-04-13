// src/store/rootReducer.js
import {combineReducers} from '@reduxjs/toolkit';

import familyReducer from '../features/home/store/familySlice';
import memoryReducer from '../features/memory/store/memorySlice';
import userReducer from '../features/home/store/userSlice';
import userChatRoomReducer from '../features/chat/store/userChatRoomSlice';
import userFamilyReducer from '../features/home/store/userFamilySlice';
import chatRoomReducer from '../features/chat/store/chatRoomSlice';
import messageReducer from '../features/chat/store/messageSlice';
import scheduleReducer from '../features/schedule/store/scheduleSlice';
import authReducer from '../features/auth/store/loginSlice';
import commentReducer from '../features/memory/store/commentSlice';
import categoryReducer from '../features/memory/store/categorySlice';
import statusReducer from '../features/home/store/statusSlice';
import notificationReducer from '../features/notification/store/notificationSlice';
import blockedUsersReducer from '../features/moderation/store/blockedUsersSlice';

import uiReducer from './uiSlice';
import {baseApi} from '../services/baseApi';

export const RESET_ALL_STATE = 'RESET_ALL_STATE';

const appReducer = combineReducers({
  ui: uiReducer,

  // RTK Query 캐시 (채팅 API)
  [baseApi.reducerPath]: baseApi.reducer,

  family: familyReducer,
  memory: memoryReducer,
  user: userReducer,
  userChatRoom: userChatRoomReducer,
  userFamily: userFamilyReducer,
  chatRoom: chatRoomReducer,
  message: messageReducer,
  schedule: scheduleReducer,
  login: authReducer,
  comment: commentReducer,
  category: categoryReducer,
  status: statusReducer,
  notification: notificationReducer,
  blockedUsers: blockedUsersReducer,
});

// RESET_ALL_STATE 액션 수신 시 모든 슬라이스를 initialState로 되돌림
const rootReducer = (state, action) => {
  if (action.type === RESET_ALL_STATE) {
    return appReducer(undefined, action);
  }
  return appReducer(state, action);
};

export default rootReducer;

