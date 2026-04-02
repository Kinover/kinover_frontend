// src/hooks/schedule/useScheduleCounts.js
import {useState, useEffect, useCallback} from 'react';
import {useGetScheduleCountPerDayQuery} from '../services/scheduleApi';

export const useScheduleCounts = (familyId, year, month) => {
  const [scheduleCountPerDay, setScheduleCountPerDay] = useState({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const {
    data: countData,
    isLoading,
    refetch,
  } = useGetScheduleCountPerDayQuery(
    {familyId, year, month},
    {
      skip: !familyId,
    },
  );

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
    const raw = countData || {};
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
