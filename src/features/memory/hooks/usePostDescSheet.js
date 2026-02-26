// src/features/post/hooks/usePostDescSheet.js
import {useCallback, useMemo, useRef, useState} from 'react';

/**
 * desc bottom sheet 상태/동작 전담
 * - index(0/1), expanded, lastIndexRef 관리
 * - 화면 로드 후 기본값(0) 동기화까지 지원
 */
export default function usePostDescSheet({
  isChromeHidden,
  isLeavingRef,
  isImageFullScreen,
  descSheetRef,
}) {
  const [descIndex, setDescIndex] = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);
  const lastDescIndexRef = useRef(0);

  const descSnapPoints = useMemo(() => ['20%', '30%'], []);

  const setDescToIndex = useCallback(
    nextIndex => {
      if (isChromeHidden) return;
      if (isLeavingRef?.current) return;
      if (isImageFullScreen) return;

      const idx = nextIndex === 1 ? 1 : 0;
      lastDescIndexRef.current = idx;

      setDescIndex(idx);
      setDescExpanded(idx === 1);

      requestAnimationFrame(() => {
        descSheetRef?.current?.snapToIndex?.(idx);
      });
    },
    [isChromeHidden, isLeavingRef, isImageFullScreen, descSheetRef],
  );

  const toggleDescByClick = useCallback(() => {
    if (isImageFullScreen) return;
    if (isChromeHidden) return;
    if (isLeavingRef?.current) return;

    setDescToIndex(descIndex === 0 ? 1 : 0);
  }, [descIndex, isChromeHidden, isImageFullScreen, isLeavingRef, setDescToIndex]);

  const collapseDesc = useCallback(() => {
    setDescToIndex(0);
  }, [setDescToIndex]);

  const syncDescOnLoaded = useCallback(() => {
    lastDescIndexRef.current = 0;
    setDescIndex(0);
    setDescExpanded(false);

    requestAnimationFrame(() => {
      descSheetRef?.current?.snapToIndex?.(0);
    });
  }, [descSheetRef]);

  const onDescSheetChange = useCallback(index => {
    const idx = index === 1 ? 1 : 0;
    lastDescIndexRef.current = idx;
    setDescIndex(idx);
    setDescExpanded(idx === 1);
  }, []);

  const showDescSheet = useMemo(() => {
    return !isChromeHidden && !isImageFullScreen;
  }, [isChromeHidden, isImageFullScreen]);

  return {
    descIndex,
    descExpanded,
    lastDescIndexRef,

    descSnapPoints,

    setDescToIndex,
    toggleDescByClick,
    collapseDesc,
    syncDescOnLoaded,

    onDescSheetChange,
    showDescSheet,
  };
}
