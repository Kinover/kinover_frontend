// src/store/rootReducer.ts
import { combineReducers } from '@reduxjs/toolkit';

// ✅ 원하는 경로 형태 그대로 (store 밑에 slice 파일들이 존재한다고 가정)
import familySlice from '../features/home/store/familySlice';
import memorySlice from '../features/memory/store/memorySlice';
import userSlice from '../features/home/store/userSlice';
import userChatRoomSlice from '../features/chat/store/userChatRoomSlice';
import userFamilySlice from '../features/home/store/userFamilySlice';
import chatRoomSlice from '../features/chat/store/chatRoomSlice';
import messageSlice from '../features/chat/store/messageSlice';
import scheduleSlice from '../features/schedule/store/scheduleSlice';
import authSlice from '../features/auth/store/authSlice';
import commentSlice from 'features/memory/store/commentSlice';
import categorySlice from 'features/memory/store/categorySlice';
import statusSlice from '../features/home/store/statusSlice';
import familyNoticeSlice from '../features/home/store/familyNoticeSlice';
import notificationSlice from '../features/notification/store/notificationSlice';

const rootReducer = combineReducers({
  family: familySlice.reducer,
  memory: memorySlice.reducer,
  user: userSlice.reducer,
  userChatRoom: userChatRoomSlice.reducer,
  userFamily: userFamilySlice.reducer,
  chatRoom: chatRoomSlice.reducer,
  message: messageSlice.reducer,
  schedule: scheduleSlice.reducer,
  login: authSlice.reducer,
  comment: commentSlice.reducer,
  category: categorySlice.reducer,
  status: statusSlice.reducer,
  familyNotice: familyNoticeSlice.reducer,
  notification: notificationSlice.reducer,
});

export default rootReducer;
