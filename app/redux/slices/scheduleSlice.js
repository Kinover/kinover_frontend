// scheduleSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  scheduleId: '',
  scheduleList: [],
  title: '',
  memo: '',
  isPersonal: '',
  date: '',
  loading: false,
  error: null,
};

const scheduleSlice = createSlice({
  name: 'schedule',
  initialState,
  reducers: {
    setScheduleList(state, action) {
      state.scheduleList = action.payload;
      state.error = null;
    },
    setScheduleLoading(state, action) {
      state.loading = action.payload;
    },
    setScheduleError(state, action) {
      state.error = action.payload;
    },
  },
});

export const {
  setScheduleList,
  setScheduleLoading,
  setScheduleError,
} = scheduleSlice.actions;

export default scheduleSlice.reducer;
