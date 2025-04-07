// fetchRecChallengeThunk.js
import axios from 'axios';
import { Platform } from 'react-native';
import { getToken } from '../../utils/storage';
import {
  setRecChallengeList,
  setRecChallengeLoading,
  setRecChallengeError,
} from '../slices/recChallengeSlice';

export const fetchRecChallengeThunk = () => {
  return async (dispatch) => {
    dispatch(setRecChallengeLoading(true));
    try {
      const apiUrl =
        Platform.OS === 'android'
          ? `http://43.200.47.242:9090/api/recChallenge/get`
          : `http://43.200.47.242:9090/api/recChallenge/get`;

      const token = await getToken();

      const response = await axios.post(apiUrl, {}, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      dispatch(setRecChallengeList(response.data));
    } catch (error) {
      dispatch(setRecChallengeError(error.message));
    } finally {
      dispatch(setRecChallengeLoading(false));
    }
  };
};


