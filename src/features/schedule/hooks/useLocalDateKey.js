// src/hooks/schedule/useLocalDateKey.js
import {useCallback} from 'react';

export const useLocalDateKey = () => {
  const getLocalDateKey = useCallback(date => {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  return getLocalDateKey;
};
