// src/features/schedule/hooks/useHolidayMap.js
import {useMemo} from 'react';
import Holidays from 'date-holidays';

// ✅ 'YYYY-MM-DD' 로 맞추는 헬퍼 (로컬 기준)
const pad2 = n => String(n).padStart(2, '0');
const toYMD = date => {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  return `${y}-${m}-${d}`;
};

export default function useHolidayMap(year) {
  return useMemo(() => {
    const hd = new Holidays('KR');

    // date-holidays는 대체공휴일 포함해서 계산해주는 편
    const list = hd.getHolidays(year) || [];

    // ✅ {'YYYY-MM-DD': true}
    const map = {};
    for (const h of list) {
      // h.date는 보통 'YYYY-MM-DD ...' 형태라 앞 10자리만 써도 됨
      const key = String(h.date).slice(0, 10);
      map[key] = true;
    }

    return map;
  }, [year]);
}
