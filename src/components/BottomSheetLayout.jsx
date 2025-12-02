// src/components/BottomSheetLayout.js

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {BottomSheetScrollView, BottomSheetFooter} from '@gorhom/bottom-sheet';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {KinoBottomSheet} from './KinoBottomSheet';
import {BottomSheetButtons} from 'components/BottomSheetButtons';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
} from 'utils/responsive';

const FOOTER_HEIGHT = 64; // 대략 버튼 높이 + 여유

export default function BottomSheetLayout({
  modalRef,
  snapPoints,
  enableContentPanningGesture = false,
  animationConfigs = {damping: 18, stiffness: 220, mass: 1},
  keyboardBehavior = 'extend',
  androidKeyboardInputMode = 'adjustResize',

  title,
  subtitle,
  children,
  footerProps,

  // ✨ 고정 footer(use gorhom Footer) 쓸지 여부
  useFixedFooter = true,

  containerStyle,
  headerStyle,
  scrollContentStyle,
  innerContentStyle,
  footerStyle,
}) {
  const insets = useSafeAreaInsets();

  const hasFixedFooter = useFixedFooter && !!footerProps;
  const hasInlineFooter = !useFixedFooter && !!footerProps;

  // ✅ 고정 footer를 쓰는 경우에만 gorhom Footer 사용
  const footerComponent =
    hasFixedFooter &&
    (footerPropsArg => (
      <BottomSheetFooter
        {...footerPropsArg}
        bottomInset={insets.bottom}>
        <View style={[styles.footer, footerStyle]}>
          <BottomSheetButtons {...footerProps} />
        </View>
      </BottomSheetFooter>
    ));

  const contentPaddingBottom = hasFixedFooter
    ? FOOTER_HEIGHT + getResponsiveHeight(12)
    : getResponsiveHeight(12); // 고정 footer 안 쓰면 그냥 살짝만 padding

  return (
    <KinoBottomSheet
      modalRef={modalRef}
      snapPoints={snapPoints}
      enableContentPanningGesture={enableContentPanningGesture}
      animationConfigs={animationConfigs}
      keyboardBehavior={keyboardBehavior}
      androidKeyboardInputMode={androidKeyboardInputMode}
      footerComponent={footerComponent}>
      <BottomSheetScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {paddingBottom: contentPaddingBottom},
          scrollContentStyle,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={[styles.container, containerStyle]}>
          {(title || subtitle) && (
            <View style={[styles.header, headerStyle]}>
              {title && <Text style={styles.title}>{title}</Text>}
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
          )}

          <View style={[styles.innerContent, innerContentStyle]}>
            {children}
          </View>

          {/* ✅ 고정 아닌 경우: 스크롤 맨 아래에 버튼 배치 */}
          {hasInlineFooter && (
            <View style={[styles.inlineFooter, footerStyle]}>
              <BottomSheetButtons {...footerProps} />
            </View>
          )}
        </View>
      </BottomSheetScrollView>
    </KinoBottomSheet>
  );
}

const styles = StyleSheet.create({
  scroll: {},
  scrollContent: {
    paddingHorizontal: getResponsiveWidth(22),
    paddingTop: getResponsiveHeight(14),
  },
  container: {
    flex: 1,
  },
  header: {
    marginBottom: getResponsiveHeight(10),
  },
  title: {
    fontSize: getResponsiveFontSize(16.5),
    fontFamily: 'Pretendard-SemiBold',
    color: '#111827',
  },
  subtitle: {
    marginTop: getResponsiveHeight(4),
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-Regular',
    color: '#6B7280',
  },
  innerContent: {},
  // 🔒 고정 footer(기존용)
  footer: {
    paddingHorizontal: getResponsiveWidth(22),
    paddingTop: getResponsiveHeight(2),
    paddingBottom: getResponsiveHeight(4),
    backgroundColor: 'white',
  },
  // 🆕 스크롤 내부 맨 아래 footer
  inlineFooter: {
    backgroundColor: 'white',
  },
});
