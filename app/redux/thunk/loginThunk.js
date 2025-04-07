// loginThunk.js
import axios from 'axios';
import {Platform} from 'react-native';
import {saveToken} from '../../utils/storage';
import {
  setLoginLoading,
  setLoginError,
  setLoginSuccess,
} from '../slices/authSlice';
import {fetchUserThunk} from './userThunk';

export const loginThunk = kakaoUserDto => {
  return async dispatch => {
    dispatch(setLoginLoading(true));
    try {
      const apiUrl =
        Platform.OS === 'android'
          ? `http://43.200.47.242:9090/api/login/kakao`
          : `http://43.200.47.242:9090/api/login/kakao`;

      const response = await axios.post(apiUrl, kakaoUserDto, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      await saveToken(response.data); // 토큰 저장

      dispatch(setLoginSuccess());
      await dispatch(fetchUserThunk()); // 유저 정보 가져오기

      console.log('토큰 저장 완료:', response.data);
    } catch (error) {
      console.error('로그인 실패:', error);
      dispatch(setLoginError(error.message));
    } finally {
      dispatch(setLoginLoading(false));
    }
  };
};
