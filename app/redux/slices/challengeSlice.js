// challengeSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialChallengeState = {
  challenge: null,
  loading: false,
  error: null,
};

const challengeSlice = createSlice({
  name: 'challenge',
  initialState: initialChallengeState,
  reducers: {
    setCurrentChallenge(state, action) {
      state.challenge = action.payload;
    },
    setChallengeLoading(state, action) {
      state.loading = action.payload;
    },
    setChallengeError(state, action) {
      state.error = action.payload;
    },
  },
});

export const { setCurrentChallenge, setChallengeLoading, setChallengeError } = challengeSlice.actions;
export default challengeSlice.reducer;
