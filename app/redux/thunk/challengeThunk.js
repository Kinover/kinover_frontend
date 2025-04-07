// setChallengeThunk.js
import axios from 'axios';
import { Platform } from 'react-native';
import { getToken } from '../../utils/storage';
import {
  setCurrentChallenge,
  setChallengeLoading,
  setChallengeError,
} from '../slices/challengeSlice';

export const setChallengeThunk = ({ family, recChallenge }) => {
  return async (dispatch) => {
    dispatch(setChallengeLoading(true));
    try {
      const apiUrl =`http://43.200.47.242:9090/api/challenge/save`;

      const token = await getToken();

      const response = await axios.post(
        apiUrl,
        { family, recChallenge },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('챌린지 세팅 성공 ->', response.data);
      dispatch(setCurrentChallenge(response.data));
    } catch (error) {
      console.error('챌린지 세팅 실패 ->', error);
      dispatch(setChallengeError(error.message));
    } finally {
      dispatch(setChallengeLoading(false));
    }
  };
};
