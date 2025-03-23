// reducer.js
import {FETCH_SCHEDULE_FOR_USER_AND_DATE, SET_LOADING, SET_ERROR} from '../actions/actionTypes';
import {initialScheduleState} from '../state'; // initialState 파일을 수정한 경로로 바꿔주세요.

// 일정 리듀서
export const scheduleReducer = (state = initialScheduleState, action) => {
  switch (action.type) {
    // 일정 정보 가져오기
    case FETCH_SCHEDULE_FOR_USER_AND_DATE:
      return {
        ...state,
        scheduleList: action.payload, // 일정 리스트 업데이트
        error: null, // 에러 초기화
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

export default scheduleReducer;
