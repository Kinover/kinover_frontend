// rootReducer.js
import {combineReducers} from '@reduxjs/toolkit';

import familyReducer from './slices/familySlice';
import memoryReducer from './slices/memorySlice';
import userReducer from './slices/userSlice';
import userChatRoomReducer from './slices/userChatRoomSlice';
import userFamilyReducer from './slices/userFamilySlice';
import chatRoomReducer from './slices/chatRoomSlice';
import messageReducer from './slices/messageSlice';
import scheduleReducer from './slices/scheduleSlice';
import loginReducer from './slices/authSlice'; // ✅ 이 줄 추가
import commentReducer from './slices/commentSlice';
import categoryReducer from './slices/categorySlice';
import statusSlice from './slices/statusSlice';
import familyNoticeReducer from './slices/familyNoticeSlice';
import notificationReducer from './slices/notificationSlice';

const rootReducer = combineReducers({
  family: familyReducer,
  memory: memoryReducer,
  user: userReducer,
  userChatRoom: userChatRoomReducer,
  userFamily: userFamilyReducer,
  chatRoom: chatRoomReducer,
  message: messageReducer,
  schedule: scheduleReducer,
  login: loginReducer,
  comment: commentReducer,
  category: categoryReducer,
  status:statusSlice,
  familyNotice:familyNoticeReducer,
  notification: notificationReducer,
});

export default rootReducer;
