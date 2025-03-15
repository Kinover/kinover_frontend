import React from 'react';
import {initialRecChallengeState} from '../state';
import {FETCH_RECCHALLENGE, SET_LOADING, SET_ERROR} from '../actions/actionTypes';

export default function recChallengeReducer(
  state = initialRecChallengeState,
  action,
) {
  switch (action.type) {
    // 특정 유저가 가진 채팅방 리스트 가져오기
    case FETCH_RECCHALLENGE:
      return {
        ...state,
        recChallenges: action.payload,
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
}
