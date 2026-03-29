// src/hooks/schedule/useFormattedScheduleDate.js
import {useMemo} from 'react';

/** 선택일 표시용 — 본문(연월일)과 요일을 분리해 타이포 계층에 쓸 수 있게 함 */
export const useFormattedScheduleDate = selectedDate => {
  return useMemo(() => {
    if (!selectedDate) {
      return {ymd: '', dowShort: ''};
    }

    const dayMap = ['일', '월', '화', '수', '목', '금', '토'];
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const day = selectedDate.getDate();
    const dayOfWeek = dayMap[selectedDate.getDay()];

    return {
      ymd: `${year}년 ${month}월 ${day}일`,
      dowShort: dayOfWeek,
    };
  }, [selectedDate]);
};
