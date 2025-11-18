// src/hooks/schedule/useCalendarLayout.js
import {useWindowDimensions} from 'react-native';
import {useMemo} from 'react';
import {getResponsiveWidth} from 'utils/responsive';

export const useCalendarLayout = () => {
  const {width: screenWidth} = useWindowDimensions();

  const OUTER_HPAD = getResponsiveWidth(20);
  const GAP = getResponsiveWidth(6);

  const {cellSize, gridWidth} = useMemo(() => {
    const availableWidth = screenWidth - OUTER_HPAD * 2;
    const cell = Math.floor((availableWidth - GAP * 6) / 7); // 7열 + 간격 6개
    const grid = cell * 7 + GAP * 6;
    return {cellSize: cell, gridWidth: grid};
  }, [screenWidth, OUTER_HPAD, GAP]);

  return {
    OUTER_HPAD,
    GAP,
    cellSize,
    gridWidth,
  };
};
