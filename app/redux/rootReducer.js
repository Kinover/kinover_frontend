// rootReducer.js
import { combineReducers } from '@reduxjs/toolkit';

import familyReducer from './slices/familySlice';
import memoryReducer from './slices/memorySlice';
import userReducer from './slices/userSlice';
import userChatRoomReducer from './slices/userChatRoomSlice';
import userFamilyReducer from './slices/userFamilySlice';
import chatRoomReducer from './slices/chatRoomSlice';
import messageReducer from './slices/messageSlice';
import recChallengeReducer from './slices/recChallengeSlice';
import scheduleReducer from './slices/scheduleSlice';
import challengeReducer from './slices/challengeSlice';
import loginReducer from './slices/authSlice'; // ✅ 이 줄 추가

const rootReducer = combineReducers({
  family: familyReducer,
  memory: memoryReducer,
  user: userReducer,
  userChatRoom: userChatRoomReducer,
  userFamily: userFamilyReducer,
  chatRoom: chatRoomReducer,
  message: messageReducer,
  recChallenge: recChallengeReducer,
  schedule: scheduleReducer,
  challenge: challengeReducer,
  login: loginReducer,
});

export default rootReducer;
