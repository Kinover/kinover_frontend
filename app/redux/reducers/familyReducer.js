import { FETCH_FAMILY, SET_LOADING, SET_ERROR } from '../actions/actionTypes';
import { initialFamilyState } from '../state';

// 영어 -> 한국어 변환 맵
const relationshipMap = {
  "AWKWARD_START": "어색한 사이",
  "GETTING_TO_KNOW": "알아가는 사이",
  "GENTLE_APPROACH": "다가가는 사이",
  "COMFORTABLE_DISTANCE": "편안한 사이",
  "SHARING_HEARTS": "진심을 나누는 사이",
  "SOLID_BOND": "단단한 사이",
  "FAMILY_OF_TRUST": "믿음의 사이",
  "UNIFIED_HEARTS": "하나된 사이"
};

// 가족 리듀서
export const familyReducer = (state = initialFamilyState, action) => {
  switch (action.type) {
    case FETCH_FAMILY:
      const { familyId, name, notice, relationship } = action.payload || {};

      return {
        familyId: familyId || state.familyId,
        name: name || state.name,
        notice: notice || state.notice,
        relationship: relationshipMap[relationship] || state.relationship // 영어 -> 한글 변환
      };

    case SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    case SET_ERROR:
      return {
        ...state,
        error: action.payload,
      };

    default:
      return state;
  }
};

export default familyReducer;
