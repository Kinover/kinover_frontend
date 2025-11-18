// src/hooks/schedule/useYMDPicker.js
import {useState, useCallback} from 'react';

export const useYMDPicker = () => {
  const [showYMD, setShowYMD] = useState(false);

  const openYMD = useCallback(() => setShowYMD(true), []);
  const closeYMD = useCallback(() => setShowYMD(false), []);

  return {
    showYMD,
    openYMD,
    closeYMD,
  };
};
