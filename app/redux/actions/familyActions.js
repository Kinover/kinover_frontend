// actions.js
import axios from 'axios';
import {SET_LOADING, FETCH_FAMILY, SET_ERROR} from './actionTypes';
import {getToken} from '../../utils/storage';
import {Platform} from 'react-native';

const getApiUrl = path =>
  Platform.OS === 'android'
    ? `http://10.0.2.2:9090${path}`
    : `http://localhost:9090${path}`;

// 가족 조회
export const fetchFamily = familyId => {
  return async dispatch => {
    dispatch({type: SET_LOADING, payload: true});
    try {
      const apiUrl = getApiUrl(`/api/family/${familyId}`);
      const token = await getToken();

      const response = await axios.post(
        apiUrl,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      dispatch({type: FETCH_FAMILY, payload: response.data});
      console.log('가족 데이터 조회 완료');
    } catch (error) {
      console.error(error);
      dispatch({
        type: SET_ERROR,
        payload:
          error.response?.status === 403
            ? '가족을 찾을 수 없습니다.'
            : error.message,
      });
    } finally {
      dispatch({type: SET_LOADING, payload: false});
    }
  };
};

// 가족 추가
export const addFamily = familyData => {
  return async dispatch => {
    dispatch({type: SET_LOADING, payload: true});
    try {
      const apiUrl = getApiUrl('/api/family/add');
      const token = await getToken();

      const response = await axios.post(apiUrl, familyData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      dispatch({type: FETCH_FAMILY, payload: response.data});
      console.log('가족 추가 완료');
    } catch (error) {
      console.error(error);
      dispatch({
        type: SET_ERROR,
        payload: error.message,
      });
    } finally {
      dispatch({type: SET_LOADING, payload: false});
    }
  };
};

// 가족 수정
export const modifyFamily = familyData => {
  return async dispatch => {
    dispatch({type: SET_LOADING, payload: true});
    try {
      const apiUrl = getApiUrl('/api/family/modify/');
      const token = await getToken();

      const response = await axios.post(apiUrl, familyData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      dispatch({type: FETCH_FAMILY, payload: response.data});
      console.log('가족 수정 완료');
    } catch (error) {
      console.error(error);
      dispatch({type: SET_ERROR, payload: error.message});
    } finally {
      dispatch({type: SET_LOADING, payload: false});
    }
  };
};

// 가족 삭제
export const deleteFamily = familyId => {
  return async dispatch => {
    dispatch({type: SET_LOADING, payload: true});
    try {
      const apiUrl = getApiUrl(`/api/family/delete/${familyId}`);
      const token = await getToken();

      await axios.post(
        apiUrl,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('가족 삭제 완료');
    } catch (error) {
      console.error(error);
      dispatch({type: SET_ERROR, payload: error.message});
    } finally {
      dispatch({type: SET_LOADING, payload: false});
    }
  };
};

// 가족 구성원 탈퇴
export const deleteFamilyUser = (familyId, userId) => {
  return async dispatch => {
    dispatch({type: SET_LOADING, payload: true});
    try {
      const apiUrl = getApiUrl(`/api/family/delete-user/${familyId}/${userId}`);
      const token = await getToken();

      await axios.post(
        apiUrl,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('가족 구성원 탈퇴 완료');
    } catch (error) {
      console.error(error);
      dispatch({type: SET_ERROR, payload: error.message});
    } finally {
      dispatch({type: SET_LOADING, payload: false});
    }
  };
};

// 가족 구성원 추가
export const addFamilyUser = (familyId, userId) => {
  return async dispatch => {
    dispatch({type: SET_LOADING, payload: true});
    try {
      const apiUrl = getApiUrl(`/api/family/add/${familyId}/${userId}`);
      const token = await getToken();

      const response = await axios.post(
        apiUrl,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      dispatch({type: FETCH_FAMILY, payload: response.data});
      console.log('가족 구성원 추가 완료');
    } catch (error) {
      console.error(error);
      dispatch({type: SET_ERROR, payload: error.message});
    } finally {
      dispatch({type: SET_LOADING, payload: false});
    }
  };
};

export default fetchFamily;
