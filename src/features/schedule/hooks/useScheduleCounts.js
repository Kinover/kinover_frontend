// src/hooks/schedule/useScheduleCounts.js
import {useState, useEffect, useCallback} from 'react';
import {useDispatch} from 'react-redux';
import { getScheduleCountPerDayThunk } from '../store/scheduleThunk';

export const useScheduleCounts = (familyId, year, month) => {
  const dispatch = useDispatch();

  const [scheduleCountPerDay, setScheduleCountPerDay] = useState({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

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
    if (!familyId) return;

    setIsLoading(true);
    dispatch(getScheduleCountPerDayThunk({familyId, year, month}))
      .then(res => {
        const raw =
          typeof res.payload === 'string'
            ? JSON.parse(res.payload)
            : res.payload || {};

        const normalized = {};
        Object.keys(raw).forEach(key => {
          const [y, m, d] = key.split('-');
          const paddedKey = `${y}-${String(m).padStart(2, '0')}-${String(
            d,
          ).padStart(2, '0')}`;
          normalized[paddedKey] = raw[key];
        });

        setScheduleCountPerDay(normalized);
      })
      .finally(() => setIsLoading(false));
  }, [familyId, year, month, refreshTrigger, dispatch]);

  return {
    scheduleCountPerDay,
    isLoading,
    refreshTrigger,
    setRefreshTrigger,
    bumpCount,
  };
};
