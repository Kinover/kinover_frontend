// redux/slices/familyNoticeSlice.ts
import { createSlice } from '@reduxjs/toolkit';

const familyNoticeSlice = createSlice({
  name: 'familyNotice',
  initialState: {
    notice: '',
    isLoading: false,
    error: null,
  },
  reducers: {
    setNotice: (state, action) => {
      state.notice = action.payload;
    },
    setNoticeLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setNoticeError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setNotice, setNoticeLoading, setNoticeError } = familyNoticeSlice.actions;
export default familyNoticeSlice.reducer;
