// src/components/KinoBottomSheet.js

import React from 'react';
import {Keyboard} from 'react-native';
import {BottomSheetModal, BottomSheetBackdrop} from '@gorhom/bottom-sheet';
import {getResponsiveWidth} from 'utils/responsive';

export function KinoBottomSheet({
  modalRef,
  snapPoints,
  children,
  enableContentPanningGesture = false,
  animationConfigs = {damping: 18, stiffness: 220, mass: 1},
  keyboardBehavior = 'extend',
  androidKeyboardInputMode = 'adjustResize',
  footerComponent,
}) {
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
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"         // ✅ 배경 탭 → 시트 닫힘
          onPress={() => {
            Keyboard.dismiss();        // ✅ 추가로 키보드만 내리기
          }}
        />
      )}
      footerComponent={footerComponent}
    >
      {children}
    </BottomSheetModal>
  );
}
