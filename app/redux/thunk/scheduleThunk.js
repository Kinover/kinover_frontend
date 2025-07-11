// scheduleThunk.js
import axios from 'axios';
import {Platform} from 'react-native';
import {getToken} from '../../utils/storage';
import {
  setScheduleList,
  setScheduleLoading,
  setScheduleError,
} from '../slices/scheduleSlice';
import {createAsyncThunk} from '@reduxjs/toolkit';

export const fetchSchedulesForFamilyAndDateThunk = (familyId, date) => {
  return async dispatch => {
    dispatch(setScheduleLoading(true));
    console.log('📅 [가족 스케줄] 요청 시작:', {familyId, date});

    try {
      const apiUrl = `https://kinover.shop/api/schedules/get`;
      const token = await getToken();

      console.log('🌐 API URL:', apiUrl);
      console.log('🔐 토큰:', token);

      // ✅ 요청 본문에 familyId, date 포함
      const response = await axios.post(
        apiUrl,
        {familyId, date},
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

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
  return async dispatch => {
    dispatch(setScheduleLoading(true));
    console.log('👤 [유저별 스케줄] 요청 시작:', {familyId, userId, date});

    try {
      const apiUrl = `https://kinover.shop/api/schedules/get`;
      const token = await getToken();

      console.log('🌐 API URL:', apiUrl);
      console.log('🔐 토큰:', token);

      const response = await axios.post(apiUrl, {
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

// ✅ 일정 추가 Thunk
export const addScheduleThunk = scheduleData => {
  return async dispatch => {
    dispatch(setScheduleLoading(true));
    console.log('📝 [스케줄 추가] 요청 시작:', scheduleData);

    try {
      const apiUrl = `https://kinover.shop/api/schedules/add`;
      const token = await getToken();

      const response = await axios.post(apiUrl, scheduleData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('✅ [스케줄 추가] 성공:', response.data);
      return response.data; // 새로 추가된 scheduleId 반환
    } catch (error) {
      console.error('❌ [스케줄 추가] 오류:', error);
      dispatch(setScheduleError(error.message));
      throw error;
    } finally {
      dispatch(setScheduleLoading(false));
    }
  };
};

// ✅ 일정 수정 Thunk
export const updateScheduleThunk = updatedScheduleData => {
  return async dispatch => {
    dispatch(setScheduleLoading(true));
    console.log('✏️ [스케줄 수정] 요청 시작:', updatedScheduleData);

    try {
      const apiUrl = `https://kinover.shop/api/schedules/modify`;
      const token = await getToken();

      const response = await axios.put(apiUrl, updatedScheduleData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('✅ [스케줄 수정] 성공:', response.data);
      return response.data; // 수정된 scheduleId 반환
    } catch (error) {
      console.error('❌ [스케줄 수정] 오류:', error);
      dispatch(setScheduleError(error.message));
      throw error;
    } finally {
      dispatch(setScheduleLoading(false));
    }
  };
};

// ✅ 일정 삭제 Thunk
export const deleteScheduleThunk = scheduleId => {
  return async dispatch => {
    dispatch(setScheduleLoading(true));
    console.log('🗑️ [스케줄 삭제] 요청 시작:', scheduleId);

    try {
      const apiUrl = `https://kinover.shop/api/schedules/remove/${scheduleId}`;
      const token = await getToken();

      const response = await axios.delete(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('✅ [스케줄 삭제] 성공:', response.data);
      return response.data; // 성공 응답 반환 (필요 시)
    } catch (error) {
      console.error('❌ [스케줄 삭제] 오류:', error);
      dispatch(setScheduleError(error.message));
      throw error;
    } finally {
      dispatch(setScheduleLoading(false));
    }
  };
};
export const getScheduleCountPerDayThunk = createAsyncThunk(
  'schedule/getCountPerDay',
  async ({familyId, year, month}, thunkAPI) => {
    try {
      const token = await getToken();
      const apiUrl = `https://kinover.shop/api/schedules/count-per-day`;

      const response = await axios.get(apiUrl, {
        params: {familyId, year, month},
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const originalData = response.data; // 예: { "2025-06-26": 1, ... }
      const shiftedData = {};

      Object.keys(originalData).forEach(key => {
        const [y, m, d] = key.split('-').map(Number);
        const originalDate = new Date(y, m - 1, d); // ✅ JS는 0-index month
        originalDate.setDate(originalDate.getDate() + 1); // ✅ 하루 더함

        const newY = originalDate.getFullYear();
        const newM = String(originalDate.getMonth() + 1).padStart(2, '0');
        const newD = String(originalDate.getDate()).padStart(2, '0');
        const newKey = `${newY}-${newM}-${newD}`;

        shiftedData[newKey] = originalData[key]; // 그대로 값 넣기
      });

      return shiftedData; // ➕ 하루 더한 날짜 기준으로 반환
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  },
);
