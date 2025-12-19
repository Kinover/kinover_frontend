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

const FOOTER_HEIGHT = 64;

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

  // ✅ 여기서 modalRef를 버튼 쪽에 주입
  const injectedFooterProps = footerProps
    ? {
        ...footerProps,
        bottomSheetRef: modalRef,
        // 필요하면 화면에서 autoCloseOnSave를 false로 override 가능
        autoCloseOnSave:
          footerProps.autoCloseOnSave !== undefined
            ? footerProps.autoCloseOnSave
            : true,
      }
    : undefined;

  const footerComponent =
    hasFixedFooter &&
    (footerPropsArg => (
      <BottomSheetFooter
        {...footerPropsArg}
        bottomInset={insets.bottom}>
        <View style={[styles.footer, footerStyle]}>
          <BottomSheetButtons {...injectedFooterProps} />
        </View>
      </BottomSheetFooter>
    ));

  const contentPaddingBottom = hasFixedFooter
    ? FOOTER_HEIGHT + getResponsiveHeight(12)
    : getResponsiveHeight(12);

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

          {/* 인라인 footer 버전도 동일하게 ref 주입 */}
          {hasInlineFooter && (
            <View style={[styles.inlineFooter, footerStyle]}>
              <BottomSheetButtons {...injectedFooterProps} />
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
    marginBottom: getResponsiveHeight(15),
  },
  title: {
    fontSize: getResponsiveFontSize(18),
    fontFamily: 'Pretendard-SemiBold',
    color: '#111827',
  },
  subtitle: {
    marginTop: getResponsiveHeight(4),
    fontSize: getResponsiveFontSize(13.5),
    fontFamily: 'Pretendard-Regular',
    color: '#6B7280',
  },
  innerContent: {},
  footer: {
    paddingHorizontal: getResponsiveWidth(22),
    paddingTop: getResponsiveHeight(2),
    paddingBottom: getResponsiveHeight(4),
    backgroundColor: 'white',
  },
  inlineFooter: {
    backgroundColor: 'white',
  },
});
