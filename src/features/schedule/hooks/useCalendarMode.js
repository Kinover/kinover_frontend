import {useState, useEffect, useMemo, useCallback, useRef} from 'react';

export const useCalendarMode = (
  initialMode,
  selectedDate,
  setSelectedDate,
  modeProp,
  setModeProp,
) => {
  const initialModeRef = useRef(initialMode);

  const isControlled = modeProp != null && typeof setModeProp === 'function';

  const [modeState, setModeState] = useState(initialModeRef.current);

  const mode = isControlled ? modeProp : modeState;
  const setMode = isControlled ? setModeProp : setModeState;

  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());

  useEffect(() => {
    setCurrentMonth(selectedDate.getMonth());
    setCurrentYear(selectedDate.getFullYear());
  }, [selectedDate]);

  const changeMonth = useCallback(
    dir => {
      const base = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth() + dir,
        1,
      );
      setCurrentMonth(base.getMonth());
      setCurrentYear(base.getFullYear());
      setSelectedDate(base);
    },
    [selectedDate, setSelectedDate],
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
  }, [setMode]);

  const headerLabel = useMemo(() => {
    const y = selectedDate.getFullYear();
    const m = selectedDate.getMonth() + 1;
    return `${y}년 ${m}월`;
  }, [selectedDate]);

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
