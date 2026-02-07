// src/features/home/store/familyThunk.js

import {apiClient} from '../../../utils/apiClient';
import {
  setOnlineUserIds,
  setLastActiveMap,
  setFamily,
  setFamilyLoading,
  setFamilyError,
} from './familySlice';

/**
 * ✅ 가족 조회
 * - POST /api/family/{familyId}
 */
export const fetchFamilyThunk = familyId => {
  return async dispatch => {
    dispatch(setFamilyLoading(true));
    try {
      const res = await apiClient.post(
        `/family/${familyId}`,
        {},
        {headers: {'Content-Type': 'application/json'}},
      );

      dispatch(setFamily(res.data));
      dispatch(setFamilyError(null));
      console.log('✅ 가족 정보 조회 성공:', res.data);

      return res.data;
    } catch (error) {
      const status = error?.response?.status;

      const msg =
        status === 403 || status === 404
          ? '가족을 찾을 수 없습니다.'
          : error?.response?.data?.message ||
            error?.response?.data ||
            error?.message ||
            '가족 정보 조회 실패';

      dispatch(setFamilyError(msg));
      console.error('❌ 가족 정보 조회 실패:', status, msg);

      throw new Error(msg);
    } finally {
      dispatch(setFamilyLoading(false));
    }
  };
};

/**
 * ✅ 가족 수정
 * - POST /api/family/modify
 */
export const modifyFamily = family => {
  return async dispatch => {
    dispatch(setFamilyLoading(true));
    try {
      const res = await apiClient.post('/family/modify', family, {
        headers: {'Content-Type': 'application/json'},
      });

      dispatch(setFamily(res.data));
      dispatch(setFamilyError(null));
      console.log('✅ 가족 정보 수정/조회 성공:', res.data);

      return res.data;
    } catch (error) {
      const status = error?.response?.status;
      const msg =
        status === 403 || status === 404
          ? '가족을 찾을 수 없습니다.'
          : error?.response?.data?.message ||
            error?.response?.data ||
            error?.message ||
            '가족 정보 수정 실패';

      dispatch(setFamilyError(msg));
      console.error('❌ 가족 정보 수정 실패:', status, msg);

      throw new Error(msg);
    } finally {
      dispatch(setFamilyLoading(false));
    }
  };
};

/**
 * ✅ 가족 접속 상태 조회
 * - GET /api/family/family-status?familyId=...
 */
export const fetchFamilyStatusThunk = familyId => {
  return async dispatch => {
    dispatch(setFamilyLoading(true));
    try {
      const res = await apiClient.get('/family/family-status', {
        params: {familyId},
      });

      const data = res.data;

      const onlineUserIds = Array.isArray(data)
        ? data.filter(u => u?.online).map(u => u.userId)
        : [];

      const lastActiveMap = Array.isArray(data)
        ? data.reduce((acc, curr) => {
            if (curr?.userId != null) acc[curr.userId] = curr.lastActiveAt;
            return acc;
          }, {})
        : {};

      dispatch(setOnlineUserIds(onlineUserIds));
      dispatch(setLastActiveMap(lastActiveMap));
      dispatch(setFamilyError(null));

      console.log('✅ 접속 상태 조회 성공:', data);

      return data;
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        '접속 상태 조회 실패';

      dispatch(setFamilyError(msg));
      console.error('❌ 접속 상태 조회 실패:', msg);

      throw new Error(msg);
    } finally {
      dispatch(setFamilyLoading(false));
    }
  };
};

/**
 * ✅ (변경) 가족 참여 - "본인"만
 * - 기존: POST /api/family/add/{familyId}/{userId}  ❌
 * - 변경: POST /api/family/join/{familyId}          ✅
 *
 * 프론트에서 userId 안 넘김.
 * 서버가 JWT에서 인증 유저를 꺼내서 가족에 추가함.
 */
export const joinFamilyThunk = familyId => {
  return async dispatch => {
    dispatch(setFamilyLoading(true));
    try {
      console.log('➡️ joinFamilyThunk 요청:', {familyId});

      const res = await apiClient.post(`/family/join/${familyId}`, null);

      console.log('✅ 가족 참여 성공:', res.data);

      // 참여 후 가족 정보 최신화
      await dispatch(fetchFamilyThunk(familyId));

      dispatch(setFamilyError(null));
      return res.data;
    } catch (error) {
      const status = error?.response?.status;
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        '가족 참여에 실패했어요.';

      console.error('❌ 가족 참여 실패:', status, msg);
      dispatch(setFamilyError(msg));

      throw new Error(msg);
    } finally {
      dispatch(setFamilyLoading(false));
    }
  };
};

/**
 * ✅ (변경) 가족 생성 + 자동 참여 (한 방)
 * - 신규: POST /api/family/create-and-join
 * - 응답: FamilyDTO (예: { familyId, name, ... })
 *
 * => 이거 쓰면 기존 createFamilyThunk + addUserToFamily 조합 필요 없음.
 */
export const createFamilyAndJoinThunk = () => {
  return async dispatch => {
    dispatch(setFamilyLoading(true));
    try {
      console.log('➡️ createFamilyAndJoinThunk 요청');

      const res = await apiClient.post('/family/create-and-join', null, {
        headers: {'Content-Type': 'application/json'},
      });

      const createdFamily = res.data; // FamilyDTO
      const newFamilyId = createdFamily?.familyId ?? null;

      console.log('✅ 가족 생성+참여 성공:', createdFamily);

      // store에 가족 정보 세팅
      if (createdFamily) {
        dispatch(setFamily(createdFamily));
      }

      dispatch(setFamilyError(null));

      // 호출부에서 familyId가 필요하면 반환
      return newFamilyId || createdFamily;
    } catch (error) {
      const status = error?.response?.status;
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        '새 가족 생성에 실패했어요.';

      console.error('❌ 가족 생성+참여 실패:', status, msg);
      dispatch(setFamilyError(msg));

      throw new Error(msg);
    } finally {
      dispatch(setFamilyLoading(false));
    }
  };
};

/**
 * ✅ (선택) 기존 createFamilyThunk 유지하고 싶으면 남겨도 되는데,
 * 지금 백엔드 기준으로는 createFamilyAndJoinThunk 쓰는 게 제일 깔끔함.
 *
 * 아래는 "가족만 만들고 참여는 따로"가 필요할 때만 사용.
 */
export const createFamilyThunk = () => {
  return async dispatch => {
    dispatch(setFamilyLoading(true));
    try {
      const res = await apiClient.post('/family/add', null, {
        headers: {'Content-Type': 'application/json'},
      });

      console.log('✅ 새 가족 생성 성공:', res.data);

      const newFamilyId =
        res.data?.familyId !== undefined ? res.data.familyId : res.data;

      dispatch(setFamilyError(null));
      return newFamilyId;
    } catch (error) {
      const status = error?.response?.status;
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        '새 가족 그룹 생성에 실패했어요.';

      console.error('❌ 새 가족 생성 실패:', status, msg);
      dispatch(setFamilyError(msg));

      throw new Error(msg);
    } finally {
      dispatch(setFamilyLoading(false));
    }
  };
};
