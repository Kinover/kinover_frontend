import { combineReducers } from 'redux';
import familyReducer from './familyReducer';
import memoryReducer from './memoryReducer';
import userReducer from './userReducer';
import userChatRoomReducer from './userChatRoomReducer';
import userFamilyReducer from './userFamilyReducer';
import scheduleReducer from './scheduleReducer';
import chatRoomReducer from './chatRoomReducer';
import messageReducer from './messageReducer';
import recChallengeReducer from './recChallengeReducer';



// 루트 리듀서
// 리듀서의 역할 - (1) 상태 새로 생성, 변화 감지하여 알림
export const rootReducer = combineReducers({
  family: familyReducer,
  memory: memoryReducer,
  user: userReducer,
  userChatRoom: userChatRoomReducer,
  userFamily: userFamilyReducer,
  chatRoom: chatRoomReducer,
  message: messageReducer,
  recChallenge: recChallengeReducer,
  schedule: scheduleReducer,
  
});

export default rootReducer;
