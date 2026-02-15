/**
 * @fileoverview 가족 구성원 관련 비동기 액션 Thunk
 * 
 * 가족 구성원 목록 조회 및 수정 등의 비동기 로직을 관리합니다.
 */

import {apiClient} from '../../../utils/apiClient';
import {
  setFamilyUserList,
  setUserFamilyLoading,
  setUserFamilyError,
} from './userFamilySlice';

// ==================== Utils ====================

/**
 * 에러 메시지 추출 헬퍼
 * @param {Error} error - 에러 객체
 * @param {string} defaultMsg - 기본 에러 메시지
 * @returns {string} 에러 메시지
 */
const extractErrorMessage = (error, defaultMsg) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data ||
    error?.message ||
    defaultMsg
  );
};

// ==================== Thunks ====================

/**
 * 가족 구성원 목록 조회
 * 
 * @param {string|number} familyId - 가족 ID
 * @returns {Function} Redux thunk 함수
 * 
 * @example
 * dispatch(fetchFamilyUserListThunk('family-123'));
 */
export const fetchFamilyUserListThunk = familyId => {
  return async dispatch => {
    dispatch(setUserFamilyLoading(true));
    try {
      const res = await apiClient.post(
        `/userFamily/familyUsers/${familyId}`,
        {},
        {
          headers: {'Content-Type': 'application/json'},
        },
      );

      const list = Array.isArray(res.data) ? res.data : [];
      dispatch(setFamilyUserList(list));
      console.log('[fetchFamilyUserListThunk] 가족 구성원 목록:', list);
    } catch (error) {
      const msg = extractErrorMessage(error, '가족 유저 목록 조회 실패');

      dispatch(setUserFamilyError(msg));
      console.error('❌ 가족 유저 목록 조회 실패:', msg);
    } finally {
      dispatch(setUserFamilyLoading(false));
    }
  };
};

/**
 * 가족 구성원 정보 수정
 * 
 * @param {Object} user - 수정할 사용자 정보
 * @param {string|number} user.userId - 사용자 ID
 * @param {string} [user.name] - 이름
 * @param {string} [user.birth] - 생년월일
 * @param {string} [user.image] - 프로필 이미지 URL
 * @returns {Function} Redux thunk 함수
 * 
 * @example
 * dispatch(modifyFamilyUserThunk({
 *   userId: 'user-1',
 *   name: '홍길동',
 *   birth: '1990-01-01'
 * }));
 */
export const modifyFamilyUserThunk = user => {
  return async (dispatch, getState) => {
    dispatch(setUserFamilyLoading(true));
    try {
      const res = await apiClient.post('/user/modify', user, {
        headers: {'Content-Type': 'application/json'},
      });

      const updatedUser = res.data;
      const {familyUserList} = getState().userFamily;

      // 기존 리스트에서 해당 유저만 업데이트
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
      const msg = extractErrorMessage(error, '프로필 수정 실패');

      dispatch(setUserFamilyError(msg));
      console.error('❌ 프로필 수정 실패:', msg);
    } finally {
      dispatch(setUserFamilyLoading(false));
    }
  };
};
