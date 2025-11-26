// loginThunk.js
import axios from 'axios';
import { saveToken, setHasFamily} from '../../../utils/storage';
import {setLoginLoading, setLoginError, setLoginSuccess} from './authSlice';

import {fetchUserThunk} from '../../home/store/userThunk';

export const loginThunk = kakaoUserDto => {
  return async dispatch => {
    dispatch(setLoginLoading(true));
    try {
      const apiUrl = 'https://kinover.shop/api/login/kakao';

      // kakaoUserDto가 문자열인지 확인하고 객체로 변환
      const requestBody =
        typeof kakaoUserDto === 'string'
          ? {accessToken: kakaoUserDto}
          : kakaoUserDto;

      // 요청 전 데이터 확인용 로그
      console.log('전송할 데이터:', JSON.stringify(requestBody));

      const response = await axios.post(apiUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      await saveToken(response.data.token); // token + hasFamily 저장
      console.log("jwt토큰",response.data.token);
      await setHasFamily(response.data.hasFamily); // token + hasFamily 저장
      console.log("패밀리아이디",response.data.hasFamily);


      dispatch(setLoginSuccess());
      await dispatch(fetchUserThunk()); // 유저 정보 가져오기

      console.log('토큰 저장 완료:', response.data);
    } catch (error) {
      // 에러 디테일 추가 출력
      console.error('로그인 실패:', {
        message: error.message,
        response: error.response ? error.response.data : null,
      });
      dispatch(setLoginError(error.message));
    } finally {
      dispatch(setLoginLoading(false));
    }
  };
};
