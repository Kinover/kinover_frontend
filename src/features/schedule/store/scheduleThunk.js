// src/features/schedule/store/scheduleThunk.js

import {createAsyncThunk} from '@reduxjs/toolkit';
import {apiClient} from '../../../utils/apiClient';
import {
  setScheduleList,
  setScheduleLoading,
  setScheduleError,
} from '../store/scheduleSlice';

/**
 * ✅ 로딩 흔들림 방지용
 * - CRUD(add/modify/remove)에서만 setScheduleLoading(true/false)를 건드리고,
 * - refresh로 태우는 "조회" thunks는 로딩을 건드리지 않도록 분리
 */
const fetchSchedulesForFamilyAndDateCore = async (familyId, date) => {
  const apiUrl = `/schedules/get`;

  const res = await apiClient.post(
    apiUrl,
    {familyId, date},
    {
      headers: {'Content-Type': 'application/json'},
    },
  );

  return res.data;
};

const fetchSchedulesForUserAndDateCore = async (familyId, userId, date) => {
  const apiUrl = `/schedules/get`;

  const res = await apiClient.post(
    apiUrl,
    {familyId, userId, date},
    {
      headers: {'Content-Type': 'application/json'},
    },
  );

  return res.data;
};

/* ---------------------- 공통 리프레시 ---------------------- */
const refreshAfterMutation = async (dispatch, refresh) => {
  if (!refresh) return;

  const {familyId, date, year, month, userId, mode} = refresh;

  const jobs = [];

  // ✅ 기본은 가족 전체 조회 (ANNIVERSARY/FAMILY ALL 누락 방지)
  if (familyId && date) {
    jobs.push(
      (async () => {
        try {
          console.log('📅 [리프레시] 가족 스케줄 조회:', {familyId, date});
          const data = await fetchSchedulesForFamilyAndDateCore(familyId, date);
          dispatch(setScheduleList(data));
        } catch (e) {
          const msg =
            e?.response?.data?.message ||
            e?.response?.data ||
            e?.message ||
            'FAMILY_REFRESH_FAILED';

          console.error('❌ [리프레시] 가족 스케줄 조회 실패:', msg);
          dispatch(setScheduleError(msg));
        }
      })(),
    );
  }

  // ✅ 유저 필터 모드일 때만 유저 조회를 추가로
  // - 이때는 "유저 조회 결과"를 scheduleList에 바로 덮어쓰면 가족조회랑 경쟁하니까
  //   ✅ 화면이 유저모드일 때만 덮어쓰기 하도록 mode로 제어
  if (mode === 'USER' && familyId && date && userId != null) {
    jobs.push(
      (async () => {
        try {
          console.log('👤 [리프레시] 유저 스케줄 조회:', {familyId, userId, date});
          const data = await fetchSchedulesForUserAndDateCore(
            familyId,
            userId,
            date,
          );
          dispatch(setScheduleList(data));
        } catch (e) {
          const msg =
            e?.response?.data?.message ||
            e?.response?.data ||
            e?.message ||
            'USER_REFRESH_FAILED';

          console.error('❌ [리프레시] 유저 스케줄 조회 실패:', msg);
          dispatch(setScheduleError(msg));
        }
      })(),
    );
  }

  // ✅ 달력 카운트
  if (familyId && year && month) {
    jobs.push(
      dispatch(getScheduleCountPerDayThunk({familyId, year, month})).unwrap?.(),
    );
  }

  await Promise.all(jobs);
};

/* ---------------------- 가족별 스케줄 (화면에서 직접 호출용) ---------------------- */
export const fetchSchedulesForFamilyAndDateThunk = (familyId, date) => {
  return async dispatch => {
    dispatch(setScheduleLoading(true));
    console.log('📅 [가족 스케줄] 요청 시작:', {familyId, date});

    try {
      const data = await fetchSchedulesForFamilyAndDateCore(familyId, date);
      console.log('✅ [가족 스케줄] 응답 데이터:', data);
      dispatch(setScheduleList(data));
      return data;
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        '가족 스케줄 조회 실패';

      console.error('❌ [가족 스케줄] 오류 발생:', msg);
      dispatch(setScheduleError(msg));
      throw error;
    } finally {
      dispatch(setScheduleLoading(false));
    }
  };
};

/* ---------------------- 유저별 스케줄 (화면에서 직접 호출용) ---------------------- */
export const fetchSchedulesForUserAndDateThunk = (familyId, userId, date) => {
  return async dispatch => {
    dispatch(setScheduleLoading(true));
    console.log('👤 [유저별 스케줄] 요청 시작:', {familyId, userId, date});

    try {
      const data = await fetchSchedulesForUserAndDateCore(familyId, userId, date);
      console.log('✅ [유저별 스케줄] 응답 데이터:', data);
      dispatch(setScheduleList(data));
      return data;
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        '유저별 스케줄 조회 실패';

      console.error('❌ [유저별 스케줄] 오류 발생:', msg);
      dispatch(setScheduleError(msg));
      throw error;
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
      const apiUrl = `/schedules/add`;

      const res = await apiClient.post(apiUrl, scheduleData, {
        headers: {'Content-Type': 'application/json'},
      });

      console.log('✅ [스케줄 추가] 성공:', res.data);

      await refreshAfterMutation(dispatch, refresh);
      return res.data;
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        '스케줄 추가 실패';

      console.error('❌ [스케줄 추가] 오류:', msg);
      dispatch(setScheduleError(msg));
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
      const apiUrl = `/schedules/modify`;

      const res = await apiClient.put(apiUrl, updatedScheduleData, {
        headers: {'Content-Type': 'application/json'},
      });

      console.log('✅ [스케줄 수정] 성공:', res.data);

      await refreshAfterMutation(dispatch, refresh);
      return res.data;
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        '스케줄 수정 실패';

      console.error('❌ [스케줄 수정] 오류:', msg);
      dispatch(setScheduleError(msg));
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
      const apiUrl = `/schedules/remove/${scheduleId}`;

      const res = await apiClient.delete(apiUrl);

      console.log('✅ [스케줄 삭제] 성공:', res.data);

      await refreshAfterMutation(dispatch, refresh);
      return res.data;
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        '스케줄 삭제 실패';

      console.error('❌ [스케줄 삭제] 오류:', msg);
      dispatch(setScheduleError(msg));
      throw error;
    } finally {
      dispatch(setScheduleLoading(false));
    }
  };
};

/* ---------------------- 날짜별 일정 개수 ---------------------- */
export const getScheduleCountPerDayThunk = createAsyncThunk(
  'schedule/getCountPerDay',
  async ({familyId, year, month}, thunkAPI) => {
    try {
      const apiUrl = `/schedules/count-per-day`;

      const res = await apiClient.get(apiUrl, {
        params: {familyId, year, month},
      });

      const originalData = res.data; // { "2025-06-26": 1, ... }
      const normalized = {};

      // ✅ 문자열 키는 그대로 사용
      Object.keys(originalData || {}).forEach(key => {
        normalized[key] = originalData[key];
      });

      return normalized;
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        '일정 개수 조회 실패';

      return thunkAPI.rejectWithValue(msg);
    }
  },
);
