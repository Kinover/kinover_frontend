// scheduleThunk.js
import axios from 'axios';
import { Platform } from 'react-native';
import { getToken } from '../../utils/storage';
import {
  setScheduleList,
  setScheduleLoading,
  setScheduleError,
} from '../slices/scheduleSlice';

export const fetchSchedulesForFamilyAndDateThunk = (familyId, date) => {
  return async (dispatch) => {
    dispatch(setScheduleLoading(true));
    console.log('📅 [가족 스케줄] 요청 시작:', { familyId, date });

    try {
      const apiUrl = `http://43.200.47.242:9090/api/schedule/get/${familyId}?date=${date}`;
      const token = await getToken();

      console.log('🌐 API URL:', apiUrl);
      console.log('🔐 토큰:', token);

      const response = await axios.post(apiUrl, {}, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('✅ [가족 스케줄] 응답 데이터:', response.data);
      dispatch(setScheduleList(response.data));
    } catch (error) {
      console.error('❌ [가족 스케줄] 오류 발생:', error);
      dispatch(setScheduleError(error.message));
    } finally {
      dispatch(setScheduleLoading(false));
      console.log('📦 [가족 스케줄] 요청 완료');
    }
  };
};

export const fetchSchedulesForUserAndDateThunk = (familyId, userId, date) => {
  return async (dispatch) => {
    dispatch(setScheduleLoading(true));
    console.log('👤 [유저별 스케줄] 요청 시작:', { familyId, userId, date });

    try {
      const apiUrl = `http://13.209.70.77:9090/api/schedule/get/${familyId}/${userId}?date=${date}`;
      const token = await getToken();

      console.log('🌐 API URL:', apiUrl);
      console.log('🔐 토큰:', token);

      const response = await axios.post(apiUrl, {}, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('✅ [유저별 스케줄] 응답 데이터:', response.data);
      dispatch(setScheduleList(response.data));
    } catch (error) {
      console.error('❌ [유저별 스케줄] 오류 발생:', error);
      dispatch(setScheduleError(error.message));
    } finally {
      dispatch(setScheduleLoading(false));
      console.log('📦 [유저별 스케줄] 요청 완료');
    }
  };
};
