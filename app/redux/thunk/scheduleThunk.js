// scheduleThunk.js
import axios from 'axios';
import {getToken} from '../../utils/storage';
import {
  setScheduleList,
  setScheduleLoading,
  setScheduleError,
} from '../slices/scheduleSlice';
import {createAsyncThunk} from '@reduxjs/toolkit';

/* ---------------------- 공통 리프레시 ---------------------- */
const refreshAfterMutation = async (dispatch, refresh) => {
  if (!refresh) return;

  const { familyId, date, year, month, userId } = refresh;
  const jobs = [];

  if (familyId && date && userId != null) {
    jobs.push(dispatch(fetchSchedulesForUserAndDateThunk(familyId, userId, date)));
  } else if (familyId && date) {
    jobs.push(dispatch(fetchSchedulesForFamilyAndDateThunk(familyId, date)));
  }

  if (familyId && year && month) {
    jobs.push(dispatch(getScheduleCountPerDayThunk({ familyId, year, month })));
  }

  await Promise.all(jobs);
};

/* ---------------------- 가족별 스케줄 ---------------------- */
export const fetchSchedulesForFamilyAndDateThunk = (familyId, date) => {
  return async dispatch => {
    dispatch(setScheduleLoading(true));
    console.log('📅 [가족 스케줄] 요청 시작:', { familyId, date });

    try {
      const apiUrl = `https://kinover.shop/api/schedules/get`;
      const token = await getToken();

      const response = await axios.post(
        apiUrl,
        { familyId, date }, // ✅ body
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
    }
  };
};

/* ---------------------- 유저별 스케줄 ---------------------- */
export const fetchSchedulesForUserAndDateThunk = (familyId, userId, date) => {
  return async dispatch => {
    dispatch(setScheduleLoading(true));
    console.log('👤 [유저별 스케줄] 요청 시작:', { familyId, userId, date });

    try {
      const apiUrl = `https://kinover.shop/api/schedules/get`;
      const token = await getToken();

      const response = await axios.post(
        apiUrl,
        { familyId, userId, date }, // ✅ body
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('✅ [유저별 스케줄] 응답 데이터:', response.data);
      dispatch(setScheduleList(response.data));
    } catch (error) {
      console.error('❌ [유저별 스케줄] 오류 발생:', error);
      dispatch(setScheduleError(error.message));
    } finally {
      dispatch(setScheduleLoading(false));
    }
  };
};

/* ---------------------- 일정 추가 ---------------------- */
export const addScheduleThunk = (scheduleData, refresh) => {
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

      await refreshAfterMutation(dispatch, refresh);
      return response.data;
    } catch (error) {
      console.error('❌ [스케줄 추가] 오류:', error);
      dispatch(setScheduleError(error.message));
      throw error;
    } finally {
      dispatch(setScheduleLoading(false));
    }
  };
};

/* ---------------------- 일정 수정 ---------------------- */
export const updateScheduleThunk = (updatedScheduleData, refresh) => {
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

      await refreshAfterMutation(dispatch, refresh);
      return response.data;
    } catch (error) {
      console.error('❌ [스케줄 수정] 오류:', error);
      dispatch(setScheduleError(error.message));
      throw error;
    } finally {
      dispatch(setScheduleLoading(false));
    }
  };
};

/* ---------------------- 일정 삭제 ---------------------- */
export const deleteScheduleThunk = (scheduleId, refresh) => {
  return async dispatch => {
    dispatch(setScheduleLoading(true));
    console.log('🗑️ [스케줄 삭제] 요청 시작:', scheduleId);

    try {
      const apiUrl = `https://kinover.shop/api/schedules/remove/${scheduleId}`;
      const token = await getToken();

      const response = await axios.delete(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('✅ [스케줄 삭제] 성공:', response.data);

      await refreshAfterMutation(dispatch, refresh);
      return response.data;
    } catch (error) {
      console.error('❌ [스케줄 삭제] 오류:', error);
      dispatch(setScheduleError(error.message));
      throw error;
    } finally {
      dispatch(setScheduleLoading(false));
    }
  };
};

/* ---------------------- 날짜별 일정 개수 ---------------------- */
export const getScheduleCountPerDayThunk = createAsyncThunk(
  'schedule/getCountPerDay',
  async ({ familyId, year, month }, thunkAPI) => {
    try {
      const token = await getToken();
      const apiUrl = `https://kinover.shop/api/schedules/count-per-day`;

      const response = await axios.get(apiUrl, {
        params: { familyId, year, month },
        headers: { Authorization: `Bearer ${token}` },
      });

      const originalData = response.data; // { "2025-06-26": 1, ... }
      const shiftedData = {};

      Object.keys(originalData).forEach(key => {
        const [y, m, d] = key.split('-').map(Number);
        const originalDate = new Date(y, m - 1, d);
        originalDate.setDate(originalDate.getDate()); // 하루 보정

        const newY = originalDate.getFullYear();
        const newM = String(originalDate.getMonth() + 1).padStart(2, '0');
        const newD = String(originalDate.getDate()).padStart(2, '0');
        const newKey = `${newY}-${newM}-${newD}`;

        shiftedData[newKey] = originalData[key];
      });

      return shiftedData;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  },
);
