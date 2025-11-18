// src/hooks/schedule/useWeekDates.js
import {useMemo} from 'react';

export const useWeekDates = (selectedDate, getLocalDateKey) => {
  const weekDates = useMemo(() => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
    const selectedKey = getLocalDateKey(selectedDate);

    return Array.from({length: 7}, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const key = getLocalDateKey(d);
      return {
        date: d,
        isSelected: key === selectedKey,
        key,
      };
    });
  }, [selectedDate, getLocalDateKey]);

  return weekDates;
};
