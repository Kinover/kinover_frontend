// userFamilyReducer.js
import { SET_USER_FAMILY, SET_FAMILY_USERS, SET_LOADING, SET_ERROR } from "../actions/userFamilyActions";
import { initialUserFamilyState } from "../state";

export const userFamilyReducer = (state = initialUserFamilyState, action) => {
  switch (action.type) {
    case SET_USER_FAMILY:
      return {
        ...state,
        userFamily: action.payload, // 서버에서 받은 userFamily 데이터로 상태 업데이트
      };
    case SET_FAMILY_USERS:
        return {
        ...state,
        familyUsers: action.payload,
        };
    case SET_LOADING:
      return {
        ...state,
        loading: action.payload, // 로딩 상태 업데이트
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

export default userFamilyReducer;
