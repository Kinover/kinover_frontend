// src/components/BottomSheetLayout.js

import React from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';
import {BottomSheetView} from '@gorhom/bottom-sheet';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {KinoBottomSheet} from './KinoBottomSheet';
import {BottomSheetButtons} from 'components/BottomSheetButtons';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
} from 'utils/responsive';
import {BOTTOMSHEET_STYLE} from 'styles/style';

export default function BottomSheetLayout({
  modalRef,
  snapPoints,
  enableContentPanningGesture = false,
  animationConfigs,
  keyboardBehavior = 'none',
  androidKeyboardInputMode = 'adjustNothing',
  // ✅ dynamic snap points용 (useBottomSheetDynamicSnapPoints에서 받아옴)
  handleHeight,
  contentHeight,
  onContentLayout, // ✅ 여기 중요

  title,
  subtitle,
  children,

  footerProps,
  containerStyle,
  headerStyle,
  innerContentStyle,
  footerStyle,
  contentStyle,

  // ✅ children만 올릴 translateY
  contentTranslateY,
}) {
  const insets = useSafeAreaInsets();

  const injectedFooterProps = footerProps
    ? {
        ...footerProps,
        bottomSheetRef: modalRef,
        autoCloseOnSave:
          footerProps.autoCloseOnSave !== undefined
            ? footerProps.autoCloseOnSave
            : true,
      }
    : undefined;

  return (
    <KinoBottomSheet
      modalRef={modalRef}
      snapPoints={snapPoints}
      enableContentPanningGesture={enableContentPanningGesture}
      animationConfigs={animationConfigs}
      keyboardBehavior={keyboardBehavior}
      androidKeyboardInputMode={androidKeyboardInputMode}
      handleHeight={handleHeight}
      contentHeight={contentHeight}>
      <BottomSheetView style={contentStyle}>
        {/* ✅ 여기 onLayout로 “콘텐츠 높이(버튼 포함)” 측정 */}
        <View
          onLayout={onContentLayout}
          style={[
            styles.container,
            {paddingBottom: insets.bottom + getResponsiveHeight(14)},
            containerStyle,
          ]}>
          {(title || subtitle) && (
            <View style={[styles.header, headerStyle]}>
              {title && <Text style={BOTTOMSHEET_STYLE.title}>{title}</Text>}
              {subtitle && (
                <Text style={BOTTOMSHEET_STYLE.subtitle}>{subtitle}</Text>
              )}
            </View>
          )}

          {/* ✅ children만 움직이게 */}
          <Animated.View
            style={[
              styles.innerContent,
              innerContentStyle,
              contentTranslateY != null
                ? {transform: [{translateY: contentTranslateY}]}
                : null,
            ]}>
            {children}
          </Animated.View>

          {/* ✅ 버튼은 고정 X, 그냥 마지막 요소 */}
          {!!injectedFooterProps && (
            <View style={[styles.inlineFooter, footerStyle]}>
              <BottomSheetButtons {...injectedFooterProps} />
            </View>
          )}
        </View>
      </BottomSheetView>
    </KinoBottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: getResponsiveWidth(22),
    paddingTop: getResponsiveHeight(14),
  },
  header: {
    marginBottom: getResponsiveHeight(15),
  },

  innerContent: {},
  inlineFooter: {
    marginTop: getResponsiveHeight(10),
    backgroundColor: 'white',
  },
});
