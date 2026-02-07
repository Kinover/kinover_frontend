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

  // ✅ 달력 count 저장용
  scheduleCountPerDay: {},
};

const scheduleSlice = createSlice({
  name: 'schedule',
  initialState,
  reducers: {
    setScheduleList(state, action) {
      state.scheduleList = [...(action.payload || [])];
      state.error = null;
    },
    setScheduleLoading(state, action) {
      state.loading = action.payload;
    },
    setScheduleError(state, action) {
      state.error = action.payload;
    },

    // ✅ 추가: 게스트/로컬 업데이트 시 count를 바로 주입하기 위해
    setScheduleCountPerDay(state, action) {
      state.scheduleCountPerDay = action.payload || {};
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getScheduleCountPerDayThunk.fulfilled, (state, action) => {
        state.scheduleCountPerDay = action.payload || {};
      })
      .addCase(getScheduleCountPerDayThunk.rejected, (state, action) => {
        state.error = action.payload || action.error?.message || 'COUNT_FAILED';
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
