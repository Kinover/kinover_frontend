// scheduleThunk.js
import axios from 'axios';
import { Platform } from 'react-native';
import { getToken } from '../../utils/storage';
import {
  setScheduleList,
  setScheduleLoading,
  setScheduleError,
} from '../slices/scheduleSlice';

export const fetchSchedulesForFamilyAndDateThunk = (familyId, date) => {
    return async (dispatch) => {
      dispatch(setScheduleLoading(true));
      try {
        const apiUrl =
          Platform.OS === 'android'
            ? `http://43.200.47.242:9090/api/schedule/get/${familyId}?date=${date}`
            : `http://43.200.47.242:9090/api/schedule/get/${familyId}?date=${date}`;
  
        const token = await getToken();
  
        const response = await axios.post(apiUrl, {}, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
  
        dispatch(setScheduleList(response.data));
      } catch (error) {
        dispatch(setScheduleError(error.message));
      } finally {
        dispatch(setScheduleLoading(false));
      }
    };
  };

export const fetchSchedulesForUserAndDateThunk = (familyId, userId, date) => {
  return async (dispatch) => {
    dispatch(setScheduleLoading(true));
    try {
      const apiUrl =
        Platform.OS === 'android'
          ? `http://13.209.70.77:9090/api/schedule/get/${familyId}/${userId}?date=${date}`
          : `http://13.209.70.77:9090/api/schedule/get/${familyId}/${userId}?date=${date}`;

      const token = await getToken();

      const response = await axios.post(apiUrl, {}, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      dispatch(setScheduleList(response.data));
    } catch (error) {
      dispatch(setScheduleError(error.message));
    } finally {
      dispatch(setScheduleLoading(false));
    }
  };
};
