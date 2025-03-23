// scheduleActions.js
import axios from 'axios';
import {
  SET_LOADING,
  SET_ERROR,
  FETCH_SCHEDULE_FOR_USER_AND_DATE,
} from './actionTypes';
import {getToken} from '../../utils/storage';
import {Platform} from 'react-native';

// ✅ 가족 아이디로 일정 조회
export const fetchSchedulesForUserAndDate = (familyId, userId, date) => {
  return async dispatch => {
    dispatch({type: SET_LOADING, payload: true});
    try {
      const apiUrl =
        Platform.OS === 'android'
          ? `http://10.0.2.2:9090/api/schedule/get/${familyId}/${userId}?date=${date}`
          : `http://localhost:9090/api/schedule/get/${familyId}/${userId}?date=${date}`;

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

      console.log(response.data);
      console.log('일정 조회 성공 ->', response.data);
      dispatch({
        type: FETCH_SCHEDULE_FOR_USER_AND_DATE,
        payload: response.data,
      });
    } catch (error) {
      console.error('일정 조회 실패 ->', error);
      dispatch({type: SET_ERROR, payload: error.message});
    } finally {
      dispatch({type: SET_LOADING, payload: false});
    }
  };
};

export const fetchSchedulesForFamilyAndDate = (familyId, date) => {
  return async dispatch => {
    dispatch({type: SET_LOADING, payload: true});
    try {
      const apiUrl =
        Platform.OS === 'android'
          ? `http://10.0.2.2:9090/api/schedule/get/${familyId}?date=${date}`
          : `http://localhost:9090/api/schedule/get/${familyId}?date=${date}`;

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

      console.log('일정 조회 성공 ->', response.data);
      dispatch({
        type: FETCH_SCHEDULE_FOR_USER_AND_DATE,
        payload: response.data,
      });
    } catch (error) {
      console.error('일정 조회 실패 ->', error);
      dispatch({type: SET_ERROR, payload: error.message});
    } finally {
      dispatch({type: SET_LOADING, payload: false});
    }
  };
};

// ✅ 일정 추가
export const addSchedule = scheduleData => {
  return async dispatch => {
    dispatch({type: SET_LOADING, payload: true});
    try {
      const apiUrl =
        Platform.OS === 'android'
          ? 'http://10.0.2.2:9090/api/schedule/add'
          : 'http://localhost:9090/api/schedule/add';

      const token = await getToken();

      const response = await axios.post(
        apiUrl,
        scheduleData, // 추가할 일정 데이터
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('일정 추가 성공 ->', response.data);
    } catch (error) {
      console.error('일정 추가 실패 ->', error);
      dispatch({type: SET_ERROR, payload: error.message});
    } finally {
      dispatch({type: SET_LOADING, payload: false});
    }
  };
};

// ✅ 일정 수정
export const modifySchedule = scheduleData => {
  return async dispatch => {
    dispatch({type: SET_LOADING, payload: true});
    try {
      const apiUrl =
        Platform.OS === 'android'
          ? 'http://10.0.2.2:9090/api/schedule/modify'
          : 'http://localhost:9090/api/schedule/modify';

      const token = await getToken();

      const response = await axios.post(
        apiUrl,
        scheduleData, // 수정할 일정 데이터
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('일정 수정 성공 ->', response.data);
    } catch (error) {
      console.error('일정 수정 실패 ->', error);
      dispatch({type: SET_ERROR, payload: error.message});
    } finally {
      dispatch({type: SET_LOADING, payload: false});
    }
  };
};

// ✅ 일정 삭제
export const deleteSchedule = scheduleId => {
  return async dispatch => {
    dispatch({type: SET_LOADING, payload: true});
    try {
      const apiUrl =
        Platform.OS === 'android'
          ? `http://10.0.2.2:9090/api/schedule/remove/${scheduleId}`
          : `http://localhost:9090/api/schedule/remove/${scheduleId}`;

      const token = await getToken();

      const response = await axios.delete(apiUrl, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('일정 삭제 성공 ->', response.data);
    } catch (error) {
      console.error('일정 삭제 실패 ->', error);
      dispatch({type: SET_ERROR, payload: error.message});
    } finally {
      dispatch({type: SET_LOADING, payload: false});
    }
  };
};
