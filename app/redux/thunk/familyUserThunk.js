// fetchFamilyUserListThunk.js
import axios from 'axios';
import { Platform } from 'react-native';
import { getToken } from '../../utils/storage';
import {
  setFamilyUserList,
  setUserFamilyLoading,
  setUserFamilyError,
} from '../slices/userFamilySlice';

export const fetchFamilyUserListThunk = (familyId) => {
  return async (dispatch) => {
    dispatch(setUserFamilyLoading(true));
    try {
      const apiUrl =`https://kinover.shop/api/userFamily/familyUsers/${familyId}`;

      const token = await getToken();

      const response = await axios.post(apiUrl, {}, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      dispatch(setFamilyUserList(Array.isArray(response.data) ? response.data : []));
      console.log(response.data);
    } catch (error) {
      dispatch(setUserFamilyError(error.message));
    } finally {
      dispatch(setUserFamilyLoading(false));
    }
  };
};

export const modifyFamilyUserThunk = user => {
  return async (dispatch, getState) => {
    dispatch(setUserFamilyLoading(true));
    try {
      const apiUrl = `https://kinover.shop/api/user/modify`;
      const token = await getToken();

      const response = await axios.post(apiUrl, user, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const updatedUser = response.data;
      const {familyUserList} = getState().userFamily;

      // ✅ 기존 리스트에서 해당 유저만 업데이트
      const updatedList = familyUserList.map(member =>
        member.userId === updatedUser.userId
          ? {
              ...member,
              name: updatedUser.name,
              birth: updatedUser.birth,
              image: updatedUser.image,
            }
          : member,
      );

      dispatch(setFamilyUserList(updatedList));
      console.log('✅ 프로필 수정 완료:', response.data);

    } catch (error) {
      dispatch(setUserFamilyError(error.message));
    } finally {
      dispatch(setUserFamilyLoading(false));
    }
  };
};