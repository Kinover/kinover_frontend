// fetchFamilyThunk.js
import axios from 'axios';
import {Platform} from 'react-native';
import {getToken} from '../../utils/storage';
import {
  setFamily,
  setFamilyLoading,
  setFamilyError,
} from '../slices/familySlice';

export const fetchFamilyThunk = familyId => {
  return async dispatch => {
    dispatch(setFamilyLoading(true));
    try {
      const apiUrl = `http://43.200.47.242:9090/api/family/${familyId}`;

      const token = await getToken();

      const response = await axios.post(
        apiUrl,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      dispatch(setFamily(response.data));
      console.log('가족 정보 조회 성공:', response.data);
    } catch (error) {
      dispatch(
        setFamilyError(
          error.response?.status === 403
            ? '가족을 찾을 수 없습니다.'
            : error.message,
        ),
      );
      console.error('가족 정보 조회 실패:', error);
    } finally {
      dispatch(setFamilyLoading(false));
    }
  };
};

export const modifyFamily = family => {
  return async dispatch => {
    dispatch(setFamilyLoading(true));
    try {
      const apiUrl = `http://43.200.47.242:9090/api/family/modify`;

      const token = await getToken();

      const response = await axios.post(apiUrl, family, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      dispatch(setFamily(response.data));
      console.log('가족 정보 조회 성공:', response.data);
    } catch (error) {
      dispatch(
        setFamilyError(
          error.response?.status === 403
            ? '가족을 찾을 수 없습니다.'
            : error.message,
        ),
      );
      console.error('가족 정보 조회 실패:', error);
    } finally {
      dispatch(setFamilyLoading(false));
    }
  };
};
