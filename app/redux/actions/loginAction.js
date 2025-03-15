import React from 'react';
import axios from 'axios';
import {SET_ERROR, SET_LOADING} from './actionTypes';
import {saveToken} from '../../utils/storage';
import {Platform} from 'react-native';
import fetchUser from './userAction';

export default function loginAction(kakaoUserDto) {
  return async dispatch => {
    dispatch({type: SET_LOADING, payload: true});
    try {
      const apiUrl =
        Platform.OS === 'android'
          ? `http://10.0.2.2:9090/api/login/kakao` // Android용 주소
          : `http://localhost:9090/api/login/kakao`; // 기타 플랫폼용 주소

      const response = await axios.post(apiUrl, kakaoUserDto, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      await saveToken(response.data);

      dispatch(fetchUser());

      console.log('토큰', response.data);
    } catch (error) {
      dispatch({type: SET_ERROR, payload: true});
      if (error.response) {
        console.error('응답 에러:', error.response); // 서버의 응답 에러 확인
      } else if (error.request) {
        console.error('요청 에러:', error.request); // 요청이 전송되었으나 응답이 없을 때
      } else {
        console.error('에러 메시지:', error.message); // 기타 에러 메시지
      }
    }
  };
}
