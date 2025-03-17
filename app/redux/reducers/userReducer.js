// reducer.js
import {
  FETCH_USER,
  SET_USER,
  SET_LOADING,
  SET_ERROR,
  LOGIN,
  LOGOUT,
  UPDATE_IMAGE,
} from '../actions/actionTypes';
import {initialUserState} from '../state'; // initialState 파일을 수정한 경로로 바꿔주세요.

// 유저 리듀서
const userReducer = (state = initialUserState, action) => {
  switch (action.type) {
    // 유저 정보 가져오기
    case FETCH_USER:
      const {userId, image, name, email} = action.payload || {};
      console.log("유저이미지",image);

      return {
        ...state, // ✅ 기존 state 유지
        userId: userId || state.userId, // 기본값 없으면 기존 값 유지
        email: email || state.email,
        image: image || state.image, // 기본값 없으면 기존 값 유지
        name: name || state.name, // 기본값 없으면 기존 값 유지
      };

    // case SET_USER:
    //   const {nickname, profileImageUrl, email} = action.payload || {};
    //   console.log('야호', action.payload);
    //   return {
    //     ...state,
    //     userId: email || state.userId,
    //     image: profileImageUrl || state.image,
    //     name: nickname || state.name,
    //     loading: false,
    //   };

    case UPDATE_IMAGE:
      return {
        ...state,
        image: action.payload ||state.image,
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

    case LOGIN:
      return {
        ...state,
        login: true,
      };

    case LOGOUT:
      return {
        userId: null,
        birth: null,
        phoneNumber: null,
        image: null,
        name: null,
        email: null,
        status: null,
        updatedAt: null,
        login: false,
        loading: false,
        error: null,
      };

    default:
      return state;
  }
};

export default userReducer;
