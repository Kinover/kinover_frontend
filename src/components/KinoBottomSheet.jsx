// src/components/KinoBottomSheet.js

import React from 'react';
import {Keyboard, Dimensions} from 'react-native';
import {BottomSheetModal, BottomSheetBackdrop} from '@gorhom/bottom-sheet';
import {getResponsiveWidth} from 'utils/responsive';

const {height: WINDOW_H} = Dimensions.get('window');

export function KinoBottomSheet({
  modalRef,
  snapPoints,
  children,
  enableContentPanningGesture = false,
  animationConfigs = {
    damping: 22,
    stiffness: 190,
    mass: 0.95,
    overshootClamping: false,
    restDisplacementThreshold: 0.5,
    restSpeedThreshold: 0.5,
  },

  // ✅ 키보드가 시트/버튼을 밀지 않게
  keyboardBehavior = 'none',
  androidKeyboardInputMode = 'adjustNothing',

  // ✅ Dynamic snap points용 (useBottomSheetDynamicSnapPoints에서 받아옴)
  handleHeight,
  contentHeight,
}) {
  return (
    <BottomSheetModal
      ref={modalRef}
      index={0}
      snapPoints={snapPoints}
      enableDynamicSizing
      maxDynamicContentSize={Math.floor(WINDOW_H * 0.85)}
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
