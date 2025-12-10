// fetchFamilyThunk.js
import axios from 'axios';
import {getToken} from '../../../utils/storage';
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
      const apiUrl = `https://kinover.shop/api/family/${familyId}`;

      const token = await getToken();
      console.log('가족 토큰' + familyId);

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
      const apiUrl = 'https://kinover.shop/api/family/modify';

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

export const fetchFamilyStatusThunk = familyId => {
  return async dispatch => {
    dispatch(setFamilyLoading(true));
    try {
      const token = await getToken();
      const response = await axios.get(
        `https://kinover.shop/api/family/family-status?familyId=${familyId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = response.data;
      const onlineUserIds = data.filter(u => u.online).map(u => u.userId);
      const lastActiveMap = data.reduce((acc, curr) => {
        acc[curr.userId] = curr.lastActiveAt;
        return acc;
      }, {});

      dispatch(setOnlineUserIds(onlineUserIds));
      dispatch(setLastActiveMap(lastActiveMap));
      console.log('✅ 접속 상태 조회 성공:', data);
    } catch (error) {
      dispatch(setFamilyError(error.message));
      console.error('❌ 접속 상태 조회 실패:', error);
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
      const token = await getToken();

      console.log('➡️ addUserToFamily 요청:', {familyId, userId});

      const response = await axios.post(
        `https://kinover.shop/api/family/add/${familyId}/${userId}`,
        null,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('✅ 유저 기존 가족에 추가 성공:', response.data);

      // 가족 정보 다시 조회해서 상태 최신화
      await dispatch(fetchFamilyThunk(familyId));

      return response.data;
    } catch (error) {
      console.error(
        '❌ 유저 기존 가족에 추가 실패:',
        error.response?.status,
        error.response?.data || error.message,
      );
      dispatch(
        setFamilyError(
          error.response?.data?.message || '가족 구성원 추가에 실패했어요.',
        ),
      );
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
      const token = await getToken();

      const response = await axios.post(
        'https://kinover.shop/api/family/add',
        null, // 바디 없음
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('✅ 새 가족 생성 성공:', response.data);

      // 서버 스펙: "새로운 가족 그룹을 생성하고 ID를 반환"
      // 보통 { familyId: 123 } 또는 숫자/문자열 하나가 올 거라서 이렇게 처리해 두자.
      const newFamilyId =
        response.data?.familyId !== undefined
          ? response.data.familyId
          : response.data;

      // 필요하다면 여기서 바로 가족 정보 조회도 가능:
      // await dispatch(fetchFamilyThunk(newFamilyId));

      return newFamilyId;
    } catch (error) {
      console.error(
        '❌ 새 가족 생성 실패:',
        error.response?.status,
        error.response?.data || error.message,
      );

      dispatch(
        setFamilyError(
          error.response?.data?.message ||
            '새 가족 그룹 생성에 실패했어요.',
        ),
      );
      throw error;
    } finally {
      dispatch(setFamilyLoading(false));
    }
  };
};

