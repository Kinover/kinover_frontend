// src/hooks/schedule/useScheduleCounts.js
import {useState, useEffect, useCallback} from 'react';
import {useGetScheduleCountPerDayQuery} from '../services/scheduleApi';
import {
  STORE_MOCK_ENABLED,
  getStoreMockScheduleCountPerDay,
} from '../../home/utils/storeMockData';

export const useScheduleCounts = (familyId, year, month, viewerUserId) => {
  const [scheduleCountPerDay, setScheduleCountPerDay] = useState({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const v = Number(viewerUserId);
  const viewerArg = Number.isFinite(v) ? v : undefined;
  const {
    data: countData,
    isLoading: queryLoading,
    refetch,
  } = useGetScheduleCountPerDayQuery(
    {familyId, year, month, viewerUserId: viewerArg},
    {
      skip: !familyId || STORE_MOCK_ENABLED,
    },
  );
  const isLoading = STORE_MOCK_ENABLED ? false : queryLoading;

  // 날짜별 일정 개수 즉시 반영용 (낙관적 업데이트)
  const bumpCount = useCallback((ymd, delta) => {
    setScheduleCountPerDay(prev => {
      const next = {...prev};
      const cur = Number(next[ymd] ?? 0);
      const val = cur + delta;
      if (val <= 0) {
        delete next[ymd];
      } else {
        next[ymd] = val;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (STORE_MOCK_ENABLED) return;
    const raw =
      countData?.countPerDay ??
      countData?.data?.countPerDay ??
      countData?.data ??
      countData ??
      {};
    const normalized = {};
    Object.keys(raw).forEach(key => {
      const [y, m, d] = key.split('-');
      const paddedKey = `${y}-${String(m).padStart(2, '0')}-${String(
        d,
      ).padStart(2, '0')}`;
      normalized[paddedKey] = raw[key];
    });
    setScheduleCountPerDay(normalized);
  }, [countData]);

  useEffect(() => {
    if (!STORE_MOCK_ENABLED) return;
    if (!familyId) return;
    setScheduleCountPerDay(getStoreMockScheduleCountPerDay(year, month));
  }, [familyId, year, month]);

  useEffect(() => {
    if (STORE_MOCK_ENABLED) return;
    if (!familyId) return;
    if (refreshTrigger == null) return;
    refetch();
  }, [familyId, refreshTrigger, refetch]);

  return {
    scheduleCountPerDay,
    isLoading,
    refreshTrigger,
    setRefreshTrigger,
    bumpCount,
  };
};
