// redux/slices/statusSlice.ts
import { createSlice } from '@reduxjs/toolkit';

const statusSlice = createSlice({
  name: 'status',
  initialState: {
    onlineUserIds: [],
  },
  reducers: {
    setOnlineUserIds: (state, action) => {
      state.onlineUserIds = action.payload;
    },
  },
});

export const { setOnlineUserIds } = statusSlice.actions;
export default statusSlice.reducer;
