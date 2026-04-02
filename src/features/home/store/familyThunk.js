/**
 * @fileoverview 가족 관련 비동기 액션 Thunk
 *  * 가족 정보 조회, 수정, 생성, 참여 등의 비동기 로직을 관리합니다.
 */

import {
  setOnlineUserIds,
  setLastActiveMap,
  setFamily,
  setFamilyLoading,
  setFamilyError,
} from './familySlice';
import {homeApi} from '../services/homeApi';

// ==================== Utils ====================

/**
 * 에러 메시지 추출 헬퍼
 * @param {Error} error - 에러 객체
 * @param {string} defaultMsg - 기본 에러 메시지
 * @returns {string} 에러 메시지
 */
const extractErrorMessage = (error, defaultMsg) => {
  const status = error?.response?.status;

  if (status === 403 || status === 404) {
    return '가족을 찾을 수 없습니다.';
  }

  return (
    error?.response?.data?.message ||
    error?.response?.data ||
    error?.message ||
    defaultMsg
  );
};

/**
 * 접속 상태 데이터 파싱
 * @param {Array} data - 서버 응답 데이터
 * @returns {Object} {onlineUserIds: Array, lastActiveMap: Object}
 */
const parseFamilyStatus = data => {
  if (!Array.isArray(data)) {
    return {onlineUserIds: [], lastActiveMap: {}};
  }

  const onlineUserIds = data.filter(u => u?.online).map(u => u.userId);

  const lastActiveMap = data.reduce((acc, curr) => {
    if (curr?.userId != null) {
      acc[curr.userId] = curr.lastActiveAt;
    }
    return acc;
  }, {});

  return {onlineUserIds, lastActiveMap};
};

// ==================== Thunks ====================

/**
 * 가족 정보 조회
 *  * @param {string|number} familyId - 가족 ID
 * @returns {Function} Redux thunk 함수
 * @returns {Promise<Object>} 가족 정보 객체
 *  * @example
 * dispatch(fetchFamilyThunk('family-123')).then(family => console.log(family));
 */
export const fetchFamilyThunk = familyId => {
  return async dispatch => {
    dispatch(setFamilyLoading(true));
    try {
      const req = dispatch(
        homeApi.endpoints.getFamily.initiate(familyId, {forceRefetch: true}),
      );
      const data = await req.unwrap();
      req.unsubscribe();

      dispatch(setFamily(data));
      dispatch(setFamilyError(null));
      console.log('✅ 가족 정보 조회 성공:', data);

      return data;
    } catch (error) {
      const msg = extractErrorMessage(error, '가족 정보 조회 실패');

      dispatch(setFamilyError(msg));
      console.error('❌ 가족 정보 조회 실패:', error?.response?.status, msg);

      throw new Error(msg);
    } finally {
      dispatch(setFamilyLoading(false));
    }
  };
};

/**
 * 가족 정보 수정
 *  * @param {Object} family - 수정할 가족 정보
 * @param {string|number} family.familyId - 가족 ID
 * @param {string} [family.name] - 가족 이름
 * @param {string} [family.notice] - 공지사항
 * @returns {Function} Redux thunk 함수
 * @returns {Promise<Object>} 수정된 가족 정보 객체
 *  * @example
 * dispatch(modifyFamily({
 * familyId: 'family-123',
 * name: '우리 가족'
 * }));
 */
export const modifyFamily = family => {
  return async dispatch => {
    dispatch(setFamilyLoading(true));
    try {
      const req = dispatch(homeApi.endpoints.modifyFamily.initiate(family));
      const data = await req.unwrap();
      req.unsubscribe();

      dispatch(setFamily(data));
      dispatch(setFamilyError(null));
      console.log('✅ 가족 정보 수정 성공:', data);

      return data;
    } catch (error) {
      const msg = extractErrorMessage(error, '가족 정보 수정 실패');

      dispatch(setFamilyError(msg));
      console.error('❌ 가족 정보 수정 실패:', error?.response?.status, msg);

      throw new Error(msg);
    } finally {
      dispatch(setFamilyLoading(false));
    }
  };
};

/**
 * 가족 접속 상태 조회
 *  * @param {string|number} familyId - 가족 ID
 * @returns {Function} Redux thunk 함수
 * @returns {Promise<Array>} 접속 상태 데이터 배열
 *  * @example
 * dispatch(fetchFamilyStatusThunk('family-123'));
 */
export const fetchFamilyStatusThunk = familyId => {
  return async dispatch => {
    dispatch(setFamilyLoading(true));
    try {
      const req = dispatch(
        homeApi.endpoints.getFamilyStatus.initiate(familyId, {forceRefetch: true}),
      );
      const data = await req.unwrap();
      req.unsubscribe();

      const {onlineUserIds, lastActiveMap} = parseFamilyStatus(data);

      dispatch(setOnlineUserIds(onlineUserIds));
      dispatch(setLastActiveMap(lastActiveMap));
      dispatch(setFamilyError(null));

      console.log('✅ 접속 상태 조회 성공:', data);

      return data;
    } catch (error) {
      const msg = extractErrorMessage(error, '접속 상태 조회 실패');

      dispatch(setFamilyError(msg));
      console.error('❌ 접속 상태 조회 실패:', msg);

      throw new Error(msg);
    } finally {
      dispatch(setFamilyLoading(false));
    }
  };
};

/**
 * 가족 참여 (본인만)
 * 서버가 JWT에서 인증된 사용자를 가족에 추가합니다.
 *  * @param {string|number} familyId - 가족 ID
 * @returns {Function} Redux thunk 함수
 * @returns {Promise<Object>} 참여 결과 객체
 *  * @example
 * dispatch(joinFamilyThunk('family-123'));
 */
export const joinFamilyThunk = familyId => {
  return async dispatch => {
    dispatch(setFamilyLoading(true));
    try {
      console.log('➡️ joinFamilyThunk 요청:', {familyId});

      const req = dispatch(homeApi.endpoints.joinFamily.initiate(familyId));
      const data = await req.unwrap();
      req.unsubscribe();

      console.log('✅ 가족 참여 성공:', data);

 // 참여 후 가족 정보 최신화
      await dispatch(fetchFamilyThunk(familyId));

      dispatch(setFamilyError(null));
      return data;
    } catch (error) {
      const msg = extractErrorMessage(error, '가족 참여에 실패했어요.');

      console.error('❌ 가족 참여 실패:', error?.response?.status, msg);
      dispatch(setFamilyError(msg));

      throw new Error(msg);
    } finally {
      dispatch(setFamilyLoading(false));
    }
  };
};

/**
 * 가족 생성 + 자동 참여 (권장)
 * 가족을 생성하고 현재 사용자를 자동으로 참여시킵니다.
 *  * @returns {Function} Redux thunk 함수
 * @returns {Promise<string|number|Object>} 생성된 가족 ID 또는 가족 정보 객체
 *  * @example
 * dispatch(createFamilyAndJoinThunk()).then(familyId => {
 * console.log('가족 생성 완료:', familyId);
 * });
 */
export const createFamilyAndJoinThunk = () => {
  return async dispatch => {
    dispatch(setFamilyLoading(true));
    try {
      console.log('➡️ createFamilyAndJoinThunk 요청');

      const req = dispatch(homeApi.endpoints.createFamilyAndJoin.initiate());
      const createdFamily = await req.unwrap();
      req.unsubscribe();

      const newFamilyId = createdFamily?.familyId ?? null;

      console.log('✅ 가족 생성+참여 성공:', createdFamily);

 // Redux store에 가족 정보 저장
      if (createdFamily) {
        dispatch(setFamily(createdFamily));
      }

      dispatch(setFamilyError(null));

 // 호출부에서 familyId가 필요하면 반환
      return newFamilyId || createdFamily;
    } catch (error) {
      const msg = extractErrorMessage(error, '새 가족 생성에 실패했어요.');

      console.error('❌ 가족 생성+참여 실패:', error?.response?.status, msg);
      dispatch(setFamilyError(msg));

      throw new Error(msg);
    } finally {
      dispatch(setFamilyLoading(false));
    }
  };
};

/**
 * 가족 생성만 (참여는 별도)
 *  * @deprecated createFamilyAndJoinThunk 사용을 권장합니다.
 *  * @returns {Function} Redux thunk 함수
 * @returns {Promise<string|number>} 생성된 가족 ID
 *  * @example
 * dispatch(createFamilyThunk()).then(familyId => {
 * // 이후 joinFamilyThunk로 참여 처리
 * });
 */
export const createFamilyThunk = () => {
  return async dispatch => {
    dispatch(setFamilyLoading(true));
    try {
      const req = dispatch(homeApi.endpoints.createFamily.initiate());
      const data = await req.unwrap();
      req.unsubscribe();

      console.log('✅ 새 가족 생성 성공:', data);

      const newFamilyId =
        data?.familyId !== undefined ? data.familyId : data;

      dispatch(setFamilyError(null));
      return newFamilyId;
    } catch (error) {
      const msg = extractErrorMessage(error, '새 가족 그룹 생성에 실패했어요.');

      console.error('❌ 새 가족 생성 실패:', error?.response?.status, msg);
      dispatch(setFamilyError(msg));

      throw new Error(msg);
    } finally {
      dispatch(setFamilyLoading(false));
    }
  };
};
