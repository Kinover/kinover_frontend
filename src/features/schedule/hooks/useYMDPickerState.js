// src/hooks/schedule/useYMDPickerState.js
import {useEffect, useMemo, useState, useCallback} from 'react';

const pad2 = n => n.toString().padStart(2, '0');
const daysInMonth = (y, m) => new Date(y, m, 0).getDate(); // m: 1~12

export const useYMDPickerState = ({
  visible,
  initialDate,
  minYear,
  maxYear,
  onConfirm,
}) => {
  const [year, setYear] = useState(initialDate.getFullYear());
  const [month, setMonth] = useState(initialDate.getMonth() + 1); // 1~12
  const [day, setDay] = useState(initialDate.getDate());

  // 모달 열릴 때마다 initialDate 기준으로 리셋
  useEffect(() => {
    if (visible) {
      setYear(initialDate.getFullYear());
      setMonth(initialDate.getMonth() + 1);
      setDay(initialDate.getDate());
    }
  }, [visible, initialDate]);

  const yearOptions = useMemo(
    () =>
      Array.from({length: maxYear - minYear + 1}, (_, i) => minYear + i),
    [minYear, maxYear],
  );

  const monthOptions = useMemo(
    () => Array.from({length: 12}, (_, i) => i + 1),
    [],
  );

  const dayOptions = useMemo(() => {
    const len = daysInMonth(year, month);
    return Array.from({length: len}, (_, i) => i + 1);
  }, [year, month]);

  // 현재 year/month에서 존재하지 않는 day면 마지막 날로 보정
  useEffect(() => {
    const len = daysInMonth(year, month);
    if (day > len) setDay(len);
  }, [year, month, day]);

  const handleConfirm = useCallback(() => {
    const selected = new Date(year, month - 1, day);
    onConfirm(selected);
  }, [year, month, day, onConfirm]);

  // Android용 Select에 넘겨줄 label/value 구조 옵션
  const androidYearOptions = useMemo(
    () => yearOptions.map(y => ({label: String(y), value: y})),
    [yearOptions],
  );

  const androidMonthOptions = useMemo(
    () => monthOptions.map(m => ({label: pad2(m), value: m})),
    [monthOptions],
  );

  const androidDayOptions = useMemo(
    () => dayOptions.map(d => ({label: pad2(d), value: d})),
    [dayOptions],
  );

  return {
    year,
    month,
    day,
    setYear,
    setMonth,
    setDay,
    yearOptions,
    monthOptions,
    dayOptions,
    androidYearOptions,
    androidMonthOptions,
    androidDayOptions,
    handleConfirm,
  };
};
