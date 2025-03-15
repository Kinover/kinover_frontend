// reducer.js
import {
  FETCH_USERCHATROOM,
  SET_LOADING,
  SET_ERROR,
} from '../actions/actionTypes';
import {initialUserChatRoomState} from '../state'; // initialState 파일을 수정한 경로로 바꿔주세요.

// 유저 채팅방 리듀서
export const userChatRoomReducer = (
  state = initialUserChatRoomState,
  action,
) => {
  switch (action.type) {
    // 유저 채팅방 정보 가져오기
    case FETCH_USERCHATROOM:
      const {userChatRoomId, joinedAt, chatRoomId, userId} =
        action.payload || {};

      return {
        ...state,
        userChatRoomId: userChatRoomId || state.userChatRoomId, // 기본값 없으면 기존 값 유지
        joinedAt: joinedAt || state.joinedAt, // 기본값 없으면 기존 값 유지
        chatRoomId: chatRoomId || state.chatRoomId, // 기본값 없으면 기존 값 유지
        userId: userId || state.userId, // 기본값 없으면 기존 값 유지
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

export default userChatRoomReducer;
