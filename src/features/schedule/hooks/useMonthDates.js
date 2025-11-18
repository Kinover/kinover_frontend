// src/hooks/schedule/useMonthDates.js
import {useMemo} from 'react';

export const useMonthDates = (
  currentYear,
  currentMonth,
  selectedDate,
  getLocalDateKey,
) => {
  const monthDates = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const start = new Date(firstDay);
    // 주 시작: 일요일 기준
    start.setDate(firstDay.getDate() - firstDay.getDay());

    const arr = [];
    const selectedKey = getLocalDateKey(selectedDate);

    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = getLocalDateKey(d);
      arr.push({
        date: d,
        isCurrentMonth: d.getMonth() === currentMonth,
        isSelected: key === selectedKey,
        key,
      });
    }
    return arr;
  }, [currentYear, currentMonth, selectedDate, getLocalDateKey]);

  return monthDates;
};
