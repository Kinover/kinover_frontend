// memorySlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialMemoryState = {
  memoryList: [],
  memoryId: '',
  date: '',
  familyId: 1,
  image: '',
  createdAt: '',
  loading: false,
  error: null,
};

const memorySlice = createSlice({
  name: 'memory',
  initialState: initialMemoryState,
  reducers: {
    setMemoryList(state, action) {
      state.memoryList = action.payload;
    },
    setMemoryLoading(state, action) {
      state.loading = action.payload;
    },
    setMemoryError(state, action) {
      state.error = action.payload;
    },
  },
});

export const { setMemoryList, setMemoryLoading, setMemoryError } = memorySlice.actions;
export default memorySlice.reducer;
