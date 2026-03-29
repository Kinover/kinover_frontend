// src/features/schedule/store/scheduleThunk.js
import {createAsyncThunk} from '@reduxjs/toolkit';
import {apiClient} from 'utils/apiClient';
import {SCHEDULES} from 'config/apiEndpoints';
import {
  setScheduleList,
  setScheduleLoading,
  setScheduleError,
  setScheduleCountPerDay, // 추가: count를 reducer로 직접 넣기용
} from './scheduleSlice';

// 게스트 모드 확인
import {getGuestMode} from 'utils/storage';
// 앱스토어 캡처용 더미 (STORE_MOCK_ENABLED 시)
import {
  STORE_MOCK_ENABLED,
  getStoreMockScheduleList,
  getStoreMockScheduleCountPerDay,
} from '../../home/utils/storeMockData';
import {normalizeScheduleListResponse} from '../utils/scheduleFilterHelpers';

/**
 * 로딩 흔들림 방지용
 * - CRUD(add/modify/remove)에서만 setScheduleLoading(true/false)를 건드리고,
 * - refresh로 태우는 "조회" thunks는 로딩을 건드리지 않도록 분리
 */
const fetchSchedulesForFamilyAndDateCore = async (familyId, date) => {
  const res = await apiClient.post(
    SCHEDULES.get,
    {familyId, date},
    {
      headers: {'Content-Type': 'application/json'},
    },
  );

  return res.data;
};

const fetchSchedulesForUserAndDateCore = async (familyId, userId, date) => {
  const res = await apiClient.post(
    SCHEDULES.get,
    {familyId, userId, date},
    {
      headers: {'Content-Type': 'application/json'},
    },
  );

  return res.data;
};

/** =========================
 * 더미 생성 유틸
 ========================= */

// YYYY-MM-DD 인지 가볍게 체크
const isYMD = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

const pad2 = n => String(n).padStart(2, '0');

// "2026-02-01" 같은 date로 더미 스케줄 리스트 생성
const makeDummyScheduleList = ({familyId, date, userId}) => {
 // date가 이상하면 오늘 기준으로라도 만들기
  let base = null;
  if (isYMD(date)) {
    const [y, m, d] = date.split('-').map(Number);
    base = new Date(y, m - 1, d, 12, 0, 0);
  } else {
    base = new Date();
  }

  const y = base.getFullYear();
  const m = base.getMonth() + 1;
  const d = base.getDate();
  const ymd = `${y}-${pad2(m)}-${pad2(d)}`;

 // 간단히 타입을 섞어 줌(서버 스키마랑 최대한 비슷하게)
  const list = [
    {
      scheduleId: 90001,
      id: 90001,
      familyId: familyId ?? 1,
      date: ymd,
      title: '게스트 더미: 가족 외식 🍚',
      type: 'FAMILY',
      participantIds: userId != null ? [userId] : [],
      memo: '게스트 모드에서는 저장되지 않아요',
      __forcedKind: 'FAMILY',
    },
    {
      scheduleId: 90002,
      id: 90002,
      familyId: familyId ?? 1,
      date: ymd,
      title: '게스트 더미: 병원 예약',
      type: 'INDIVIDUAL',
      participantIds: userId != null ? [userId] : [],
      memo: '',
      __forcedKind: 'INDIVIDUAL',
    },
    {
      scheduleId: 90003,
      id: 90003,
      familyId: familyId ?? 1,
      date: ymd,
      title: '게스트 더미: 기념일',
      type: 'ANNIVERSARY',
      participantIds: [],
      memo: '기념일 타입 테스트',
      __forcedKind: 'ANNIVERSARY',
    },
    {
      scheduleId: 90004,
      id: 90004,
      familyId: familyId ?? 1,
      date: ymd,
      title: '게스트 더미: 산책 30분',
      type: 'INDIVIDUAL',
      participantIds: userId != null ? [userId] : [],
      memo: '',
      __forcedKind: 'INDIVIDUAL',
    },
  ];

  return list;
};

// month 카운트 더미 생성
const makeDummyCountPerDay = ({year, month}) => {
  const map = {};
  const days = [3, 7, 12, 18, 24, 28];

  days.forEach((day, idx) => {
    const key = `${year}-${pad2(month)}-${pad2(day)}`;
    map[key] = (idx % 4) + 1; // 1~4
  });

 // 1일도 살짝
  const key1 = `${year}-${pad2(month)}-01`;
  map[key1] = map[key1] ?? 2;

  return map;
};

/* ---------------------- 공통 리프레시 ---------------------- */
const refreshAfterMutation = async (dispatch, refresh) => {
  if (!refresh) return;

  const {familyId, date, year, month, userId, mode} = refresh;

 // 스토어 목업이면: API 안 타고 더미로 리프레시
  if (STORE_MOCK_ENABLED) {
    if (familyId && date) {
      const list = getStoreMockScheduleList(date);
      dispatch(setScheduleList(list));
    }
    if (familyId && year && month) {
      dispatch(setScheduleCountPerDay(getStoreMockScheduleCountPerDay(year, month)));
    }
    return;
  }

 // 게스트 모드면: API 안 타고 더미로 리프레시
  const isGuest = await getGuestMode().catch(() => false);
  if (isGuest) {
    const dummyList = makeDummyScheduleList({familyId, date, userId});
    dispatch(setScheduleList(dummyList));

    if (familyId && year && month) {
      const dummyCount = makeDummyCountPerDay({year, month});
      dispatch(setScheduleCountPerDay(dummyCount));
    }

    return;
  }

  const jobs = [];

 // 기본은 가족 전체 조회 (ANNIVERSARY/FAMILY ALL 누락 방지)
  if (familyId && date) {
    jobs.push(
      (async () => {
        try {
          console.log('📅 [리프레시] 가족 스케줄 조회:', {familyId, date});
          const data = await fetchSchedulesForFamilyAndDateCore(familyId, date);
          dispatch(setScheduleList(data));
        } catch (e) {
          const msg =
            e?.response?.data?.message ||
            e?.response?.data ||
            e?.message ||
            'FAMILY_REFRESH_FAILED';

          console.error('❌ [리프레시] 가족 스케줄 조회 실패:', msg);
          dispatch(setScheduleError(msg));
        }
      })(),
    );
  }

  if (mode === 'USER' && familyId && date && userId != null) {
    jobs.push(
      (async () => {
        try {
          console.log('👤 [리프레시] 유저 스케줄 조회:', {familyId, userId, date});
          const data = await fetchSchedulesForUserAndDateCore(
            familyId,
            userId,
            date,
          );
          dispatch(setScheduleList(data));
        } catch (e) {
          const msg =
            e?.response?.data?.message ||
            e?.response?.data ||
            e?.message ||
            'USER_REFRESH_FAILED';

          console.error('❌ [리프레시] 유저 스케줄 조회 실패:', msg);
          dispatch(setScheduleError(msg));
        }
      })(),
    );
  }

 // 달력 카운트
  if (familyId && year && month) {
    jobs.push(
      dispatch(getScheduleCountPerDayThunk({familyId, year, month})).unwrap?.(),
    );
  }

  await Promise.all(jobs);
};

/* ---------------------- 가족별 스케줄 (화면에서 직접 호출용) ---------------------- */
export const fetchSchedulesForFamilyAndDateThunk = (familyId, date) => {
  return async dispatch => {
    if (STORE_MOCK_ENABLED) {
      const list = getStoreMockScheduleList(date);
      dispatch(setScheduleList(list));
      return list;
    }
 // 게스트 모드 분기
    const isGuest = await getGuestMode().catch(() => false);
    if (isGuest) {
 // 로딩 흔들림 없이 더미만 세팅
      const dummy = makeDummyScheduleList({familyId, date, userId: null});
      dispatch(setScheduleList(dummy));
      return dummy;
    }

    dispatch(setScheduleLoading(true));
    console.log('📅 [가족 스케줄] 요청 시작:', {familyId, date});

    try {
      const data = await fetchSchedulesForFamilyAndDateCore(familyId, date);
      console.log('✅ [가족 스케줄] 응답 데이터:', data);
      dispatch(setScheduleList(data));
      return data;
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        '가족 스케줄 조회 실패';

      console.error('❌ [가족 스케줄] 오류 발생:', msg);
      dispatch(setScheduleError(msg));
      throw error;
    } finally {
      dispatch(setScheduleLoading(false));
    }
  };
};

/* ---------------------- 유저별 스케줄 (화면에서 직접 호출용) ---------------------- */
export const fetchSchedulesForUserAndDateThunk = (familyId, userId, date) => {
  return async dispatch => {
    if (STORE_MOCK_ENABLED) {
      const list = getStoreMockScheduleList(date);
      dispatch(setScheduleList(list));
      return list;
    }
 // 게스트 모드 분기
    const isGuest = await getGuestMode().catch(() => false);
    if (isGuest) {
      const dummy = makeDummyScheduleList({familyId, date, userId});
      dispatch(setScheduleList(dummy));
      return dummy;
    }

    dispatch(setScheduleLoading(true));
    console.log('👤 [유저별 스케줄] 요청 시작:', {familyId, userId, date});

    try {
      const data = await fetchSchedulesForUserAndDateCore(
        familyId,
        userId,
        date,
      );
      console.log('✅ [유저별 스케줄] 응답 데이터:', data);
      dispatch(setScheduleList(data));
      return data;
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        '유저별 스케줄 조회 실패';

      console.error('❌ [유저별 스케줄] 오류 발생:', msg);
      dispatch(setScheduleError(msg));
      throw error;
    } finally {
      dispatch(setScheduleLoading(false));
    }
  };
};

/* ---------------------- 일정 추가 ---------------------- */
export const addScheduleThunk = (scheduleData, refresh) => {
  return async dispatch => {
    if (STORE_MOCK_ENABLED) {
      const date = scheduleData?.date ?? refresh?.date;
      if (date) dispatch(setScheduleList(getStoreMockScheduleList(date)));
      if (refresh?.year && refresh?.month) {
        dispatch(
          setScheduleCountPerDay(
            getStoreMockScheduleCountPerDay(refresh.year, refresh.month),
          ),
        );
      }
      return {ok: true, mock: true};
    }
 // 게스트 모드 분기: 서버 저장 금지, 대신 UI용 더미 반영
    const isGuest = await getGuestMode().catch(() => false);
    if (isGuest) {
 // 로딩 켜면 UX가 이상할 수 있어(빠르게 끝나니까)
      const familyId = scheduleData?.familyId ?? refresh?.familyId;
      const date = scheduleData?.date ?? refresh?.date;
      const userId = refresh?.userId;

      const dummy = makeDummyScheduleList({familyId, date, userId});
      const newItem = {
        scheduleId: Date.now(),
        id: Date.now(),
        familyId: familyId ?? 1,
        date: isYMD(date) ? date : undefined,
        title: scheduleData?.title ?? '게스트 더미: 새 일정',
        type: scheduleData?.type ?? 'INDIVIDUAL',
        participantIds: scheduleData?.participantIds ?? [],
        memo: scheduleData?.memo ?? '',
        __forcedKind: scheduleData?.type ?? scheduleData?.__forcedKind,
      };

      dispatch(setScheduleList([newItem, ...dummy]));
      if (refresh?.year && refresh?.month) {
        dispatch(setScheduleCountPerDay(makeDummyCountPerDay(refresh)));
      }
      return {ok: true, guest: true};
    }

    dispatch(setScheduleLoading(true));
    console.log('📝 [스케줄 추가] 요청 시작:', scheduleData);

    try {
      const res = await apiClient.post(SCHEDULES.add, scheduleData, {
        headers: {'Content-Type': 'application/json'},
      });

      console.log('✅ [스케줄 추가] 성공:', res.data);

      await refreshAfterMutation(dispatch, refresh);
      return res.data;
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        '스케줄 추가 실패';

      console.error('❌ [스케줄 추가] 오류:', msg);
      dispatch(setScheduleError(msg));
      throw error;
    } finally {
      dispatch(setScheduleLoading(false));
    }
  };
};

/* ---------------------- 일정 수정 ---------------------- */
export const updateScheduleThunk = (updatedScheduleData, refresh) => {
  return async dispatch => {
    if (STORE_MOCK_ENABLED) {
      const date =
        updatedScheduleData?.date ?? refresh?.date;
      if (date) dispatch(setScheduleList(getStoreMockScheduleList(date)));
      if (refresh?.year && refresh?.month) {
        dispatch(
          setScheduleCountPerDay(
            getStoreMockScheduleCountPerDay(refresh.year, refresh.month),
          ),
        );
      }
      return {ok: true, mock: true};
    }
 // 게스트 모드 분기: 서버 저장 금지, 대신 리스트에서 해당 항목만 수정
    const isGuest = await getGuestMode().catch(() => false);
    if (isGuest) {
      const familyId = updatedScheduleData?.familyId ?? refresh?.familyId;
      const date = updatedScheduleData?.date ?? refresh?.date;
      const userId = refresh?.userId;

      const base = makeDummyScheduleList({familyId, date, userId});
      const targetId =
        updatedScheduleData?.scheduleId ?? updatedScheduleData?.id;

      const next = base.map(item => {
        const itemId = item?.scheduleId ?? item?.id;
        if (targetId != null && itemId === targetId) {
          return {...item, ...updatedScheduleData};
        }
        return item;
      });

      dispatch(setScheduleList(next));
      if (refresh?.year && refresh?.month) {
        dispatch(setScheduleCountPerDay(makeDummyCountPerDay(refresh)));
      }
      return {ok: true, guest: true};
    }

    dispatch(setScheduleLoading(true));
    console.log('✏️ [스케줄 수정] 요청 시작:', updatedScheduleData);

    try {
      const res = await apiClient.put(SCHEDULES.modify, updatedScheduleData, {
        headers: {'Content-Type': 'application/json'},
      });

      console.log('✅ [스케줄 수정] 성공:', res.data);

      await refreshAfterMutation(dispatch, refresh);
      return res.data;
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        '스케줄 수정 실패';

      console.error('❌ [스케줄 수정] 오류:', msg);
      dispatch(setScheduleError(msg));
      throw error;
    } finally {
      dispatch(setScheduleLoading(false));
    }
  };
};

/* ---------------------- 일정 삭제 ---------------------- */
export const deleteScheduleThunk = (scheduleId, refresh) => {
  return async dispatch => {
    if (STORE_MOCK_ENABLED) {
      const date = refresh?.date;
      if (date) dispatch(setScheduleList(getStoreMockScheduleList(date)));
      if (refresh?.year && refresh?.month) {
        dispatch(
          setScheduleCountPerDay(
            getStoreMockScheduleCountPerDay(refresh.year, refresh.month),
          ),
        );
      }
      return {ok: true, mock: true};
    }
 // 게스트 모드 분기: 서버 삭제 금지, 대신 리스트에서 제거한 것처럼 보이기
    const isGuest = await getGuestMode().catch(() => false);
    if (isGuest) {
      const familyId = refresh?.familyId;
      const date = refresh?.date;
      const userId = refresh?.userId;

      const base = makeDummyScheduleList({familyId, date, userId});
      const next = base.filter(item => {
        const itemId = item?.scheduleId ?? item?.id;
        return itemId !== scheduleId;
      });

      dispatch(setScheduleList(next));
      if (refresh?.year && refresh?.month) {
        dispatch(setScheduleCountPerDay(makeDummyCountPerDay(refresh)));
      }
      return {ok: true, guest: true};
    }

    dispatch(setScheduleLoading(true));
    console.log('🗑️ [스케줄 삭제] 요청 시작:', scheduleId);

    try {
      const res = await apiClient.delete(SCHEDULES.remove(scheduleId));

      console.log('✅ [스케줄 삭제] 성공:', res.data);

      await refreshAfterMutation(dispatch, refresh);
      return res.data;
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        '스케줄 삭제 실패';

      console.error('❌ [스케줄 삭제] 오류:', msg);
      dispatch(setScheduleError(msg));
      throw error;
    } finally {
      dispatch(setScheduleLoading(false));
    }
  };
};

/* ---------------------- 날짜별 일정 개수 ---------------------- */
/** Redux 없이 일별 일정 배열만 조회 (달력 사람 필터용 일괄 집계) */
export async function fetchSchedulesForFamilyAndDateApi(familyId, date) {
  if (STORE_MOCK_ENABLED) {
    return normalizeScheduleListResponse(getStoreMockScheduleList(date));
  }
  const isGuest = await getGuestMode().catch(() => false);
  if (isGuest) {
    return normalizeScheduleListResponse(
      makeDummyScheduleList({familyId, date, userId: null}),
    );
  }
  const data = await fetchSchedulesForFamilyAndDateCore(familyId, date);
  return normalizeScheduleListResponse(data);
}

export const getScheduleCountPerDayThunk = createAsyncThunk(
  'schedule/getCountPerDay',
  async ({familyId, year, month}, thunkAPI) => {
    if (STORE_MOCK_ENABLED) {
      return getStoreMockScheduleCountPerDay(year, month);
    }
 // 게스트 모드면 더미 리턴
    const isGuest = await getGuestMode().catch(() => false);
    if (isGuest) {
      return makeDummyCountPerDay({year, month});
    }

    try {
      const res = await apiClient.get(SCHEDULES.countPerDay, {
        params: {familyId, year, month},
      });

      const originalData = res.data; // { "2025-06-26": 1, ... }
      const normalized = {};

 // 문자열 키는 그대로 사용
      Object.keys(originalData || {}).forEach(key => {
        normalized[key] = originalData[key];
      });

      return normalized;
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        '일정 개수 조회 실패';

      return thunkAPI.rejectWithValue(msg);
    }
  },
);
