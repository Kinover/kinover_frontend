import React from 'react';
// reducer.js
// 초기 설정값
import {FETCH_MESSAGE,SET_LOADING, SET_ERROR, SEND_MESSAGE} from '../actions/actionTypes';
import {initialMessageState} from '../state';

export default function messageReducer(state = initialMessageState, action) {
  switch (action.type) {
    // 특정 유저가 가진 채팅방 리스트 가져오기
    case FETCH_MESSAGE:
      return {
        ...state,
        messages: action.payload,
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

    case SEND_MESSAGE:
      return {
        ...state,
        sendMessage: action.payload,
      };

    default:
      return state;
  }
}
