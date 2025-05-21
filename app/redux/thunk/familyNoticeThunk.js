// redux/thunk/familyNoticeThunk.ts
import axios from 'axios';
import { getToken } from '../../utils/storage';
import {
  setNotice,
  setNoticeLoading,
  setNoticeError,
} from '../slices/familyNoticeSlice';

export const fetchFamilyNoticeThunk = familyId => {
  return async dispatch => {
    dispatch(setNoticeLoading(true));
    try {
      const token = await getToken();
      const response = await axios.get(
        `http://43.200.47.242:9090/api/family/notice/${familyId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      dispatch(setNotice(response.data));
    } catch (error) {
      dispatch(setNoticeError(error.message));
      console.error('[가족 공지 조회 실패]', error);
    } finally {
      dispatch(setNoticeLoading(false));
    }
  };
};

export const updateFamilyNoticeThunk = (familyId, noticeText) => {
  return async dispatch => {
    dispatch(setNoticeLoading(true));
    try {
      const token = await getToken();
      const response = await axios.put(
        `http://43.200.47.242:9090/api/family/notice/${familyId}`,
        noticeText,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      dispatch(setNotice(response.data));
    } catch (error) {
      dispatch(setNoticeError(error.message));
      console.error('[가족 공지 수정 실패]', error);
    } finally {
      dispatch(setNoticeLoading(false));
    }
  };
};
