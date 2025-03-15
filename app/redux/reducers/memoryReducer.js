// reducer.js
import {FETCH_MEMORY,SET_LOADING, SET_ERROR} from '../actions/actionTypes';
import {initialMemoryState} from '../state';

// 추억 리듀서
export const memoryReducer = (state = initialMemoryState, action) => {
  switch (action.type) {
    // 추억 정보 가져오기
    case FETCH_MEMORY:
      // const { memoryId, content, createdAt,date, image, familyId, userId } = action.payload || {};

      // return {
      //   memoryId: memoryId || state.memoryId,  // 기본값 없으면 기존 값 유지
      //   content: content || state.content,     // 기본값 없으면 기존 값 유지
      //   createdAt: createdAt ||state.createdAt,
      //   date: date || state.date,              // 기본값 없으면 기존 값 유지
      //   image: image || state.image,           // 기본값 없으면 기존 값 유지
      //   familyId: familyId || state.familyId,  // 기본값 없으면 기존 값 유지
      //   userId: userId || state.userId,
      // };

      return {
        ...state,
        memories: action.payload,
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

export default memoryReducer;
