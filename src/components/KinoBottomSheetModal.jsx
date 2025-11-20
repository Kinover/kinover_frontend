// src/components/KinoBottomSheet.js

import React from 'react';
import {Keyboard} from 'react-native';
import {BottomSheetModal, BottomSheetBackdrop} from '@gorhom/bottom-sheet';
import {
  getResponsiveWidth,
} from 'utils/responsive';

/**
 * 공통 BottomSheet 래퍼
 * - 공통 배경/라운드/인디케이터/백드롭 처리
 * - modalRef + snapPoints만 넘겨주고, 안쪽은 children으로 자유롭게 사용
 */
export function KinoBottomSheet({
  modalRef,
  snapPoints,
  children,
  enableContentPanningGesture = false,
  animationConfigs = {damping: 18, stiffness: 220, mass: 1},
  keyboardBehavior = 'extend',
  androidKeyboardInputMode = 'adjustResize',
}) {
  const handleBackdropPress = () => {
    Keyboard.dismiss();
    modalRef?.current?.snapToIndex?.(0);
  };

  return (
    <BottomSheetModal
      ref={modalRef}
      index={0}
      snapPoints={snapPoints}
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
      }}
      keyboardBehavior={keyboardBehavior}
      keyboardBlurBehavior="restore"
      android_keyboardInputMode={androidKeyboardInputMode}
      backdropComponent={props => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          onPress={handleBackdropPress}
          pressBehavior="close"
        />
      )}>
      {children}
    </BottomSheetModal>
  );
}
