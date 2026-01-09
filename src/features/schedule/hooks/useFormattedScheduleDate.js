// src/hooks/schedule/useFormattedScheduleDate.js
import {useMemo} from 'react';

export const useFormattedScheduleDate = selectedDate => {
  const formatted = useMemo(() => {
    if (!selectedDate) return '';

    const dayMap = ['일', '월', '화', '수', '목', '금', '토'];
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const day = selectedDate.getDate();
    const dayOfWeek = dayMap[selectedDate.getDay()];

    // return `${year}년 ${month}월 ${day}일 (${dayOfWeek})`;
    return `${year}.${month}.${day} (${dayOfWeek})`;

  }, [selectedDate]);

  return formatted;
};
