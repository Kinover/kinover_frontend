// fetchFamilyUserListThunk.js

import {apiClient} from '../../../utils/apiClient';
import {
  setFamilyUserList,
  setUserFamilyLoading,
  setUserFamilyError,
} from './userFamilySlice';

export const fetchFamilyUserListThunk = familyId => {
  return async dispatch => {
    dispatch(setUserFamilyLoading(true));
    try {
      // POST /api/userFamily/familyUsers/{familyId}
      const res = await apiClient.post(
        `/userFamily/familyUsers/${familyId}`,
        {},
        {
          headers: {'Content-Type': 'application/json'},
        },
      );

      const list = Array.isArray(res.data) ? res.data : [];
      dispatch(setFamilyUserList(list));
      console.log(list);
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        '가족 유저 목록 조회 실패';

      dispatch(setUserFamilyError(msg));
    } finally {
      dispatch(setUserFamilyLoading(false));
    }
  };
};

export const modifyFamilyUserThunk = user => {
  return async (dispatch, getState) => {
    dispatch(setUserFamilyLoading(true));
    try {
      // POST /api/user/modify
      const res = await apiClient.post('/user/modify', user, {
        headers: {'Content-Type': 'application/json'},
      });

      const updatedUser = res.data;
      const {familyUserList} = getState().userFamily;

      // ✅ 기존 리스트에서 해당 유저만 업데이트
      const updatedList = (familyUserList || []).map(member =>
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
      console.log('✅ 프로필 수정 완료:', res.data);
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        '프로필 수정 실패';

      dispatch(setUserFamilyError(msg));
    } finally {
      dispatch(setUserFamilyLoading(false));
    }
  };
};
