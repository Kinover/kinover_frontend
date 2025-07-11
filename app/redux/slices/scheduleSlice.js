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
      state.scheduleList = [...action.payload]; // 🔥 이렇게 레퍼런스 바꿔주면 리렌더 확실!
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
