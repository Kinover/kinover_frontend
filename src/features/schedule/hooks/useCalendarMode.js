// src/hooks/schedule/useCalendarMode.js
import {useState, useEffect, useMemo, useCallback} from 'react';

export const useCalendarMode = (initialMode, selectedDate, setSelectedDate) => {
  const [mode, setMode] = useState(initialMode);
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());

  // selectedDate 바뀌면 현재 연/월 동기화
  useEffect(() => {
    setCurrentMonth(selectedDate.getMonth());
    setCurrentYear(selectedDate.getFullYear());
  }, [selectedDate]);

  const changeMonth = useCallback(
    dir => {
      const newDate = new Date(currentYear, currentMonth + dir, 1);
      setCurrentMonth(newDate.getMonth());
      setCurrentYear(newDate.getFullYear());
      setSelectedDate(newDate);
    },
    [currentYear, currentMonth, setSelectedDate],
  );

  const changeWeek = useCallback(
    dir => {
      const d = new Date(selectedDate);
      d.setDate(selectedDate.getDate() + dir * 7);
      setSelectedDate(d);
    },
    [selectedDate, setSelectedDate],
  );

  const toggleMode = useCallback(() => {
    setMode(m => (m === 'month' ? 'week' : 'month'));
  }, []);

  const headerLabel = useMemo(() => {
    if (mode === 'month') {
      return `${currentYear}년 ${currentMonth + 1}월`;
    }
    return `${selectedDate.getFullYear()}년 ${
      selectedDate.getMonth() + 1
    }월`;
  }, [mode, currentYear, currentMonth, selectedDate]);

  return {
    mode,
    toggleMode,
    currentMonth,
    currentYear,
    changeMonth,
    changeWeek,
    headerLabel,
  };
};
