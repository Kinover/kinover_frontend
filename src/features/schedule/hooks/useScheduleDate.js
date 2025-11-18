// src/hooks/schedule/useScheduleDate.js
import {useState, useMemo} from 'react';

export const useScheduleDate = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const toLocalYMD = d => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const formattedDate = useMemo(
    () => toLocalYMD(selectedDate),
    [selectedDate],
  );

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth() + 1;

  return {
    selectedDate,
    setSelectedDate,
    formattedDate,
    year,
    month,
  };
};
