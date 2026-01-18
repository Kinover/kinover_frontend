// fetchFamilyThunk.js

import {apiClient} from '../../../utils/apiClient';
import {
  setOnlineUserIds,
  setLastActiveMap,
  setFamily,
  setFamilyLoading,
  setFamilyError,
} from './familySlice';

export const fetchFamilyThunk = familyId => {
  return async dispatch => {
    dispatch(setFamilyLoading(true));
    try {
      // POST /api/family/{familyId}
      const res = await apiClient.post(`/family/${familyId}`, {}, {
        headers: {'Content-Type': 'application/json'},
      });

      dispatch(setFamily(res.data));
      console.log('✅ 가족 정보 조회 성공:', res.data);
    } catch (error) {
      const status = error?.response?.status;
      const msg =
        status === 403
          ? '가족을 찾을 수 없습니다.'
          : error?.response?.data?.message ||
            error?.response?.data ||
            error?.message ||
            '가족 정보 조회 실패';

      dispatch(setFamilyError(msg));
      console.error('❌ 가족 정보 조회 실패:', status, msg);
    } finally {
      dispatch(setFamilyLoading(false));
    }
  };
};

export const modifyFamily = family => {
  return async dispatch => {
    dispatch(setFamilyLoading(true));
    try {
      // POST /api/family/modify
      const res = await apiClient.post('/family/modify', family, {
        headers: {'Content-Type': 'application/json'},
      });

      dispatch(setFamily(res.data));
      console.log('✅ 가족 정보 수정/조회 성공:', res.data);
    } catch (error) {
      const status = error?.response?.status;
      const msg =
        status === 403
          ? '가족을 찾을 수 없습니다.'
          : error?.response?.data?.message ||
            error?.response?.data ||
            error?.message ||
            '가족 정보 수정 실패';

      dispatch(setFamilyError(msg));
      console.error('❌ 가족 정보 수정 실패:', status, msg);
    } finally {
      dispatch(setFamilyLoading(false));
    }
  };
};

export const fetchFamilyStatusThunk = familyId => {
  return async dispatch => {
    dispatch(setFamilyLoading(true));
    try {
      // GET /api/family/family-status?familyId=...
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

      console.log('✅ 접속 상태 조회 성공:', data);
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        '접속 상태 조회 실패';

      dispatch(setFamilyError(msg));
      console.error('❌ 접속 상태 조회 실패:', msg);
    } finally {
      dispatch(setFamilyLoading(false));
    }
  };
};

// 가족 구성원 추가
export const addUserToFamily = (familyId, userId) => {
  return async dispatch => {
    dispatch(setFamilyLoading(true));
    try {
      console.log('➡️ addUserToFamily 요청:', {familyId, userId});

      // POST /api/family/add/{familyId}/{userId}
      const res = await apiClient.post(`/family/add/${familyId}/${userId}`, null);

      console.log('✅ 유저 기존 가족에 추가 성공:', res.data);

      // 가족 정보 다시 조회해서 상태 최신화
      await dispatch(fetchFamilyThunk(familyId));

      return res.data;
    } catch (error) {
      const status = error?.response?.status;
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        '가족 구성원 추가에 실패했어요.';

      console.error('❌ 유저 기존 가족에 추가 실패:', status, msg);
      dispatch(setFamilyError(msg));

      throw error;
    } finally {
      dispatch(setFamilyLoading(false));
    }
  };
};

// 가족 그룹 생성 (입력값 없이 호출 → 새 가족 생성 + ID 반환)
export const createFamilyThunk = () => {
  return async dispatch => {
    dispatch(setFamilyLoading(true));
    try {
      // POST /api/family/add
      const res = await apiClient.post('/family/add', null, {
        headers: {'Content-Type': 'application/json'},
      });

      console.log('✅ 새 가족 생성 성공:', res.data);

      // 서버 스펙: "새로운 가족 그룹을 생성하고 ID를 반환"
      // 보통 { familyId: 123 } 또는 숫자/문자열 하나가 올 수 있음
      const newFamilyId =
        res.data?.familyId !== undefined ? res.data.familyId : res.data;

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

      throw error;
    } finally {
      dispatch(setFamilyLoading(false));
    }
  };
};
