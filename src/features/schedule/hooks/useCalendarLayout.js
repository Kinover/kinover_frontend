// src/hooks/schedule/useCalendarLayout.js
import {useWindowDimensions, PixelRatio} from 'react-native';
import {useMemo} from 'react';
import {getResponsiveWidth} from 'utils/responsive';

export const useCalendarLayout = () => {
  const {width: screenWidth} = useWindowDimensions();

  const OUTER_HPAD = getResponsiveWidth(14);
  const CARD_HPAD = getResponsiveWidth(10); // ✅ Calendar.jsx의 calendarCard paddingHorizontal과 반드시 동일
  const GAP = getResponsiveWidth(0);

  const {cellSize, gridWidth, cardWidth} = useMemo(() => {
    // ✅ 카드 내부 “콘텐츠 영역” 기준으로 cell 계산
    const contentWidth = screenWidth - OUTER_HPAD * 2 - CARD_HPAD * 2;

    const rawCell = (contentWidth - GAP * 6) / 7;
    const cell = PixelRatio.roundToNearestPixel(rawCell);

    const grid = cell * 7 + GAP * 6;
    const card = grid + CARD_HPAD * 2;

    return {cellSize: cell, gridWidth: grid, cardWidth: card};
  }, [screenWidth, OUTER_HPAD, CARD_HPAD, GAP]);

  return {OUTER_HPAD, CARD_HPAD, GAP, cellSize, gridWidth, cardWidth};
};
