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

import uiReducer from './uiSlice';

const rootReducer = combineReducers({
  ui: uiReducer, // 추가 (맨 위든 아래든 상관 없음)

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
});

export default rootReducer;

