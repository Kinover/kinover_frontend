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
  footerComponent, // ✅ 그대로 둠
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
      )}
      footerComponent={footerComponent} // ✅ gorhom footer 사용
    >
      {children}
    </BottomSheetModal>
  );
}
