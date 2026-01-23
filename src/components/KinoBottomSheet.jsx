// src/components/KinoBottomSheet.js

import React, {useMemo} from 'react';
import {Keyboard, Dimensions} from 'react-native';
import {BottomSheetModal, BottomSheetBackdrop} from '@gorhom/bottom-sheet';
import {useSelector} from 'react-redux';
import {FONT_MODE} from 'store/uiSlice';
import {getResponsiveWidth} from 'utils/responsive';

const {height: WINDOW_H} = Dimensions.get('window');

export function KinoBottomSheet({
  modalRef,
  snapPoints,
  children,
  enableContentPanningGesture = false,
  animationConfigs,
  keyboardBehavior = 'none',
  androidKeyboardInputMode = 'adjustNothing',
  handleHeight,
  contentHeight,
}) {
  // ✅ 1. 폰트모드 구독 (이거 없으면 아무것도 안 바뀜)
  const fontMode = useSelector(state => state.ui.fontMode);

  // ✅ 2. multiplier
  const fontMul = useMemo(() => {
    if (fontMode === FONT_MODE.EXTRA_LARGE) return 1.22;
    if (fontMode === FONT_MODE.LARGE) return 1.12;
    return 1.0;
  }, [fontMode]);

  // ✅ 3. snapPoints 재계산 (핵심)
  const resolvedSnapPoints = useMemo(() => {
    if (!Array.isArray(snapPoints)) return snapPoints;

    return snapPoints.map(sp => {
      if (typeof sp === 'number') {
        return Math.min(
          Math.floor(sp * fontMul),
          Math.floor(WINDOW_H * 0.85),
        );
      }
      return sp; // 'CONTENT_HEIGHT' 같은 문자열은 그대로
    });
  }, [snapPoints, fontMul]);

  return (
    <BottomSheetModal
      ref={modalRef}
      index={0}
      snapPoints={resolvedSnapPoints}
      enableDynamicSizing
      maxDynamicContentSize={Math.floor(WINDOW_H * 0.85 * fontMul)}
      handleHeight={handleHeight}
      contentHeight={contentHeight}
      animationConfigs={animationConfigs}
      enableContentPanningGesture={enableContentPanningGesture}
      backgroundStyle={{
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
      }}
      handleIndicatorStyle={{
        width: getResponsiveWidth(40),
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E5E7EB',
        // 🔥 폰트 커질수록 indicator도 살짝 커지게
        transform: [{scaleX: fontMul}],
      }}
      keyboardBehavior={keyboardBehavior}
      keyboardBlurBehavior="restore"
      android_keyboardInputMode={androidKeyboardInputMode}
      backdropComponent={props => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
          onPress={() => Keyboard.dismiss()}
        />
      )}>
      {children}
    </BottomSheetModal>
  );
}
