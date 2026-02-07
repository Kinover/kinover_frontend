// src/components/botomSheet/MeasuredBottomSheetLayout.jsx
/* eslint-disable react-native/no-inline-styles */
import React, {useMemo, useEffect} from 'react';
import BottomSheetLayout from 'components/botomSheet/BottomSheetLayout';
import {useMeasuredSnapPoints} from 'hooks/useMeasuredSnapPoints';

export default function MeasuredBottomSheetLayout({
  modalRef,
  title,
  subtitle,

  // snap 계산 옵션
  windowH,
  fontModeKey,
  extraResetKeys = [],
  fallbackSnapPoints = ['65%', '99%'],
  extraPx,
  minPct,
  maxPct,
  includeAndroidBottomSafeInFooter = true,

  // 외부 강제 snap (있으면 우선)
  externalSnapPoints,

  // sheetKey prefix
  sheetKeyPrefix = 'sheet',

  // BottomSheetLayout props passthrough
  children,
  onDismiss,
  useInternalScroll = false,
  enableContentPanningGesture,
  keyboardBehavior,
  androidKeyboardInputMode,
  closeOnPressOutside,
  snapToIndexOnTouchInside,
  snapIndexOnTouchInside,
  onTouchInside,
  dismissKeyboardOnPress,
  disableContentBottomPadding,
  useTouchOverlay,
  defaultSnapPoints,
}) {
  const {
    snapPoints,
    measuredReady,
    resetMeasures,
    bottomSafe,
    measureHandlers,
  } = useMeasuredSnapPoints({
    windowH,
    fontModeKey,
    extraResetKeys,
    externalSnapPoints,
    fallbackSnapPoints,
    extraPx,
    minPct,
    maxPct,
    includeAndroidBottomSafeInFooter,
  });

  const sheetKey = useMemo(() => {
    const snapKey = (snapPoints || []).join('|');
    return `${sheetKeyPrefix}-${String(fontModeKey ?? '')}-${snapKey}`;
  }, [sheetKeyPrefix, fontModeKey, snapPoints]);

  useEffect(() => {
    if (!measuredReady) return;
    requestAnimationFrame(() => modalRef?.current?.snapToIndex?.(0));
  }, [measuredReady, sheetKey, modalRef]);

  const handleDismiss = () => {
    resetMeasures();
    onDismiss?.();
  };

  return (
    <BottomSheetLayout
      modalRef={modalRef}
      snapPoints={snapPoints}
      defaultSnapPoints={defaultSnapPoints || snapPoints}
      sheetKey={sheetKey}
      title={title}
      subtitle={subtitle}
      useInternalScroll={useInternalScroll}
      enableContentPanningGesture={enableContentPanningGesture}
      keyboardBehavior={keyboardBehavior}
      androidKeyboardInputMode={androidKeyboardInputMode}
      closeOnPressOutside={closeOnPressOutside}
      snapToIndexOnTouchInside={snapToIndexOnTouchInside}
      snapIndexOnTouchInside={snapIndexOnTouchInside}
      onTouchInside={onTouchInside}
      dismissKeyboardOnPress={dismissKeyboardOnPress}
      disableContentBottomPadding={disableContentBottomPadding}
      useTouchOverlay={useTouchOverlay}
      onDismiss={handleDismiss}
      // ✅ header 실측은 여기서 자동 연결
      onHeaderLayout={measureHandlers.onHeaderLayout}>
      {/* children 쪽에서 content/footer 실측만 연결하면 됨 */}
      {typeof children === 'function'
        ? children({measureHandlers, resetMeasures, bottomSafe})
        : children}
    </BottomSheetLayout>
  );
}
