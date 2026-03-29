// src/hooks/schedule/useMonthDates.js
import {useMemo} from 'react';

/**
 * 월 뷰용 날짜 셀 — 항상 6주(42칸)가 아니라,
 * 해당 달 마지막 날이 속한 주의 토요일까지만 포함 (4~6주).
 * 주 시작: 일요일.
 */
export const useMonthDates = (
  currentYear,
  currentMonth,
  selectedDate,
  getLocalDateKey,
) => {
  const monthDates = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const start = new Date(firstDay);
    start.setDate(firstDay.getDate() - firstDay.getDay());

    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const end = new Date(lastDayOfMonth);
    end.setDate(
      lastDayOfMonth.getDate() + (6 - lastDayOfMonth.getDay()),
    );

    const arr = [];
    const selectedKey = getLocalDateKey(selectedDate);
    const endTime = end.getTime();

    const d = new Date(start);
    while (d.getTime() <= endTime) {
      const key = getLocalDateKey(d);
      arr.push({
        date: new Date(d.getTime()),
        isCurrentMonth: d.getMonth() === currentMonth,
        isSelected: key === selectedKey,
        key,
      });
      d.setDate(d.getDate() + 1);
    }

    return arr;
  }, [currentYear, currentMonth, selectedDate, getLocalDateKey]);

  return monthDates;
};
