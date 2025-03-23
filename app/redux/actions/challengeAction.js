// challengeActions.js
import axios from 'axios';
import { SET_LOADING, SET_ERROR } from './actionTypes';
import { getToken } from '../../utils/storage';
import { Platform } from 'react-native';

// ✅ 가족 챌린지 목록 조회
export const fetchChallenges = (familyId) => {
  return async (dispatch) => {
    dispatch({ type: SET_LOADING, payload: true });
    try {
      const apiUrl =
        Platform.OS === 'android'
          ? `http://10.0.2.2:9090/api/challenge/${familyId}`
          : `http://localhost:9090/api/challenge/${familyId}`;

      const token = await getToken();

      const response = await axios.post(
        apiUrl,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      console.log('챌린지 목록 조회 성공 ->', response.data);
      // 필요하다면 payload로 넘겨서 reducer 처리 가능
    } catch (error) {
      console.error('챌린지 목록 조회 실패 ->', error);
      dispatch({
        type: SET_ERROR,
        payload: error.message,
      });
    } finally {
      dispatch({ type: SET_LOADING, payload: false });
    }
  };
};

// ✅ 챌린지 상세 조회 (challengeId로)
export const fetchChallengeDetail = (challengeId) => {
  return async (dispatch) => {
    dispatch({ type: SET_LOADING, payload: true });
    try {
      const apiUrl =
        Platform.OS === 'android'
          ? `http://10.0.2.2:9090/api/challenge/${challengeId}`
          : `http://localhost:9090/api/challenge/${challengeId}`;

      const token = await getToken();

      const response = await axios.post(
        apiUrl,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      console.log('챌린지 상세 조회 성공 ->', response.data);
      // 필요하다면 payload로 넘겨서 reducer 처리 가능
    } catch (error) {
      console.error('챌린지 상세 조회 실패 ->', error);
      dispatch({
        type: SET_ERROR,
        payload: error.message,
      });
    } finally {
      dispatch({ type: SET_LOADING, payload: false });
    }
  };
};

// ✅ 챌린지 삭제
export const deleteChallenge = (challengeId) => {
  return async (dispatch) => {
    dispatch({ type: SET_LOADING, payload: true });
    try {
      const apiUrl =
        Platform.OS === 'android'
          ? `http://10.0.2.2:9090/api/challenge/delete/${challengeId}`
          : `http://localhost:9090/api/challenge/delete/${challengeId}`;

      const token = await getToken();

      const response = await axios.post(
        apiUrl,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      console.log('챌린지 삭제 성공 ->', response.data);
      // 필요하다면 삭제 후 리스트 다시 조회 가능
    } catch (error) {
      console.error('챌린지 삭제 실패 ->', error);
      dispatch({
        type: SET_ERROR,
        payload: error.message,
      });
    } finally {
      dispatch({ type: SET_LOADING, payload: false });
    }
  };
};
