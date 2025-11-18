// src/hooks/schedule/useScheduleListByDate.js
import {useEffect, useMemo} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import { fetchSchedulesForFamilyAndDateThunk } from '../store/scheduleThunk';

export const useScheduleListByDate = (selectedDate, refreshTrigger) => {
  const dispatch = useDispatch();
  const {familyId} = useSelector(state => state.family);
  const {scheduleList} = useSelector(state => state.schedule);

  const formatLocalYMD = d => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // 의존성 깔끔하게: Date → 'YYYY-MM-DD'
  const selectedYMD = useMemo(
    () => (selectedDate ? formatLocalYMD(selectedDate) : ''),
    [selectedDate],
  );

  useEffect(() => {
    if (!familyId || !selectedYMD) return;
    dispatch(fetchSchedulesForFamilyAndDateThunk(familyId, selectedYMD));
  }, [dispatch, familyId, selectedYMD, refreshTrigger]);

  return {scheduleList, selectedYMD};
};
