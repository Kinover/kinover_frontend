import axios from 'axios';
import {getToken} from '../../utils/storage';

// 액션 타입 정의
export const SET_USER_FAMILY = 'SET_USER_FAMILY';
export const SET_LOADING = 'SET_LOADING'; // 로딩 상태
export const SET_ERROR = 'SET_ERROR'; // 에러 상태
export const SET_FAMILY_USER_LIST = 'SET_FAMILY_USER_LIST';

// 유저 패밀리 정보 가져오기 (가족 ID로)
export const fetchFamilyUserList = familyId => {
  return async dispatch => {
    dispatch({type: SET_LOADING, payload: true}); // 로딩 상태 시작
    try {
      // Android일 경우 10.0.2.2로 변경, 그렇지 않으면 localhost
      const apiUrl =
        Platform.OS === 'android'
          ? `http://10.0.2.2:9090/api/userFamily/familyUsers/${familyId}` // Android용 주소
          : `http://localhost:9090/api/userFamily/familyUsers/${familyId}`; // 기타 플랫폼용 주소

      // 백엔드에서 데이터 가져오기
      console.log('Fetching family users data...');

      const token = await getToken();

      const response = await axios.post(
        apiUrl,
        {}, // 토큰은 헤더에 담아 보내므로 바디는 빈 객체로
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`, // 🔹 Authorization 헤더에 token 넣기
          },
        },
      );

      // 가져온 유저들을 UserFamily 상태에 설정
      dispatch({
        type: SET_FAMILY_USER_LIST,
        payload: Array.isArray(response.data) ? response.data : [], // 배열이면 그대로, 아니면 빈 배열
        // payload: response.data,
      });
    } catch (error) {
      console.error(error);
      dispatch({
        type: SET_ERROR,
        payload: error.message, // 에러 메시지 전달
      });
    } finally {
      dispatch({type: SET_LOADING, payload: false}); // 로딩 상태 종료
    }
  };
};
