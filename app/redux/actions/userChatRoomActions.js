// actions.js
import axios from 'axios';
import {SET_LOADING, FETCH, SET_ERROR} from './actionTypes'; // actionTypes 임포트
import {getToken} from '../../utils/storage';

// 비동기 액션 생성 함수
export const fetchUserChatRoom = familyId => {
  return async dispatch => {
    dispatch({type: SET_LOADING, payload: true}); // 로딩 상태 시작
    try {
      // 백엔드에서 데이터 가져오기
      console.log('Fetching family data...');

      const apiUrl =
        Platform.OS === 'android'
          ? `http://10.0.2.2:9090/api/family/${familyId}` // Android용 주소
          : `http://localhost:9090/api/family/${familyId}`; // 기타 플랫폼용 주소

      const token = await getToken();

      const response = await axios.post(
        apiUrl,
        {}, // 토큰은 헤더에 담아 보내므로 바디는 빈 객체로
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`, // 🔹 Authorization 헤더에 token 넣기
          },
        },
      );

      // 백엔드에서 데이터 가져오기
      console.log('Fetching family data...');

      // 가져온 데이터로 상태 업데이트
      dispatch({
        type: FETCH_FAMILY,
        payload: response.data, // family 데이터
      });

      console.log('데이터 적용완료');
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
export default fetchUserChatRoom;
