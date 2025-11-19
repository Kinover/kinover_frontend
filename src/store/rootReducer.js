// src/store/rootReducer.ts
import { combineReducers } from '@reduxjs/toolkit';

// ⭕ 모든 slice는 default export(=reducer)만 import
import familyReducer from '../features/home/store/familySlice';
import memoryReducer from '../features/memory/store/memorySlice';
import userReducer from '../features/home/store/userSlice';
import userChatRoomReducer from '../features/chat/store/userChatRoomSlice';
import userFamilyReducer from '../features/home/store/userFamilySlice';
import chatRoomReducer from '../features/chat/store/chatRoomSlice';
import messageReducer from '../features/chat/store/messageSlice';
import scheduleReducer from '../features/schedule/store/scheduleSlice';
import authReducer from '../features/auth/store/authSlice';
import commentReducer from '../features/memory/store/commentSlice';
import categoryReducer from '../features/memory/store/categorySlice';
import statusReducer from '../features/home/store/statusSlice';
import familyNoticeReducer from '../features/home/store/familyNoticeSlice';
import notificationReducer from '../features/notification/store/notificationSlice';

const rootReducer = combineReducers({
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
  familyNotice: familyNoticeReducer,
  notification: notificationReducer,
});

export default rootReducer;
