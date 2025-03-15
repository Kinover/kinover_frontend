// reducer.js
// 초기 설정값
import {
  FETCH_CHATROOM_LIST,
  SET_LOADING, SET_ERROR
} from '../actions/actionTypes';
import {initialChatRoomState} from '../state';

// 가족 리듀서
export const chatRoomReducer = (state = initialChatRoomState, action) => {
  switch (action.type) {
    // 특정 유저가 가진 채팅방 리스트 가져오기

    case FETCH_CHATROOM_LIST:
      return {
        ...state,
        chatRooms: action.payload, // 받아온 ChatRoomDTO 리스트로 상태 업데이트
      };

    case SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    case SET_ERROR:
      return {
        ...state,
        error: action.payload, // 에러 메시지 업데이트
      };

    default:
      return state;
  }
};

export default chatRoomReducer;
