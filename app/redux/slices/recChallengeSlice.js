// recChallengeSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  recChallengeList: [],
  loading: false,
  error: null,
};

const recChallengeSlice = createSlice({
  name: 'recChallenge',
  initialState,
  reducers: {
    setRecChallengeList(state, action) {
      state.recChallengeList = action.payload;
    },
    setRecChallengeLoading(state, action) {
      state.loading = action.payload;
    },
    setRecChallengeError(state, action) {
      state.error = action.payload;
    },
  },
});

export const {
  setRecChallengeList,
  setRecChallengeLoading,
  setRecChallengeError,
} = recChallengeSlice.actions;

export default recChallengeSlice.reducer;
