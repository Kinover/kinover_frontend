// reducer.js
import {FETCH_SCHEDULE,SET_LOADING, SET_ERROR} from '../actions/actionTypes';
import {initialScheduleState} from '../state'; // initialState 파일을 수정한 경로로 바꿔주세요.

// 일정 리듀서
export const scheduleReducer = (state = initialScheduleState, action) => {
  switch (action.type) {
    // 일정 정보 가져오기
    case FETCH_SCHEDULE:
      const {scheduleId, content, date, image, familyId} = action.payload || {};

      return {
        scheduleId: scheduleId || state.scheduleId, // 기본값 없으면 기존 값 유지
        content: content || state.content, // 기본값 없으면 기존 값 유지
        date: date || state.date, // 기본값 없으면 기존 값 유지
        image: image || state.image, // 기본값 없으면 기존 값 유지
        familyId: familyId || state.familyId, // 기본값 없으면 기존 값 유지
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
