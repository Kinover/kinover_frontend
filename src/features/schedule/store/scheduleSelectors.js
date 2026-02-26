// src/features/schedule/store/scheduleSelectors.js
// 날짜별 일정 필터링을 createSelector로 메모이제이션
import {createSelector} from '@reduxjs/toolkit';

const selectScheduleState = state => state?.schedule ?? {};
const selectScheduleList = createSelector(
  [selectScheduleState],
  schedule => schedule?.scheduleList ?? [],
);

const toYMD = date => {
  if (!date) return '';
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** 날짜별 일정 리스트 (메모이제이션) */
export const selectSchedulesByDate = createSelector(
  [selectScheduleList, (_, date) => date],
  (list, date) => {
    const ymd = toYMD(date);
    if (!ymd) return [];
    return (Array.isArray(list) ? list : []).filter(
      item => (item?.date ?? '') === ymd,
    );
  },
);

export {selectScheduleList};
