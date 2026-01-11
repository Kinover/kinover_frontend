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

  // ✅ (있으면 편함) 달력 count 저장용
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

export const {setScheduleList, setScheduleLoading, setScheduleError} =
  scheduleSlice.actions;

export default scheduleSlice.reducer;
