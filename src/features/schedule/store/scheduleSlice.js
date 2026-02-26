// src/features/schedule/store/scheduleSlice.js
import {createSlice} from '@reduxjs/toolkit';
import {getScheduleCountPerDayThunk} from './scheduleThunk';

const initialState = {
  scheduleId: '',
  scheduleList: [],
  title: '',
  memo: '',
  isPersonal: '',
  date: '',
  loading: false,
  error: null,

 // 달력 count 저장용
  scheduleCountPerDay: {},
};

const scheduleSlice = createSlice({
  name: 'schedule',
  initialState,
  reducers: {
    setScheduleList(state, action) {
      const list = action?.payload;
      state.scheduleList = Array.isArray(list) ? [...list] : [];
      state.error = null;
    },
    setScheduleLoading(state, action) {
      state.loading = !!action?.payload;
    },
    setScheduleError(state, action) {
      state.error = action?.payload ?? null;
    },
    setScheduleCountPerDay(state, action) {
      const payload = action?.payload;
      state.scheduleCountPerDay =
        payload && typeof payload === 'object' && !Array.isArray(payload)
          ? payload
          : {};
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getScheduleCountPerDayThunk.fulfilled, (state, action) => {
        const payload = action?.payload;
        state.scheduleCountPerDay =
          payload && typeof payload === 'object' && !Array.isArray(payload)
            ? payload
            : {};
      })
      .addCase(getScheduleCountPerDayThunk.rejected, (state, action) => {
        state.error =
          action?.payload ?? action?.error?.message ?? 'COUNT_FAILED';
      });
  },
});

export const {
  setScheduleList,
  setScheduleLoading,
  setScheduleError,
  setScheduleCountPerDay,
} = scheduleSlice.actions;

export default scheduleSlice.reducer;
