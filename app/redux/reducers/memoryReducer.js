// reducer.js
import {FETCH_MEMORY,SET_LOADING, SET_ERROR} from '../actions/actionTypes';
import {initialMemoryState} from '../state';

// 추억 리듀서
export const memoryReducer = (state = initialMemoryState, action) => {
  switch (action.type) {
    // 추억 정보 가져오기
    case FETCH_MEMORY:
      return {
        ...state,
        memoryList: action.payload,
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
