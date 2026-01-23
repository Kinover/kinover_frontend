// src/components/BottomSheetLayout.js
/* eslint-disable react-native/no-inline-styles */

import React, {useMemo, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
  Keyboard,
  Pressable,
} from 'react-native';

import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';

import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
} from 'utils/responsive';

import {BOTTOMSHEET_STYLE, COLORS} from 'styles/style';

export default function BottomSheetLayout({
  modalRef,

  snapPoints,
  defaultSnapPoints = ['92%'],

  useInternalScroll = true,

  enableContentPanningGesture = false,
  animationConfigs,
  keyboardBehavior = 'none',
  androidKeyboardInputMode = 'adjustNothing',

  onDismiss,
  closeOnPressOutside = true,

  title,
  subtitle,

  children,

  containerStyle,
  headerStyle,
  innerContentStyle,
  contentStyle,

  contentTranslateY,

  dismissKeyboardOnPress = true,

  onTouchInside,

  snapToIndexOnTouchInside = false,
  snapIndexOnTouchInside = 0,
}) {
  const insets = useSafeAreaInsets();
  const WINDOW_H = Dimensions.get('window').height;

  const safeBottom = Math.max(insets.bottom, getResponsiveHeight(10));

  const resolvedSnapPoints = useMemo(() => {
    if (Array.isArray(snapPoints) && snapPoints.length > 0) return snapPoints;
    return defaultSnapPoints;
  }, [snapPoints, defaultSnapPoints]);

  const handleDismiss = useCallback(() => {
    onDismiss?.();
  }, [onDismiss]);

  const renderBackdrop = useCallback(
    props => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior={closeOnPressOutside ? 'close' : 'none'}
      />
    ),
    [closeOnPressOutside],
  );

  const animatedContentStyle = useMemo(() => {
    return [
      styles.animatedContent,
      contentTranslateY ? {transform: [{translateY: contentTranslateY}]} : null,
    ];
  }, [contentTranslateY]);

  const handleTouchInside = useCallback(() => {
    // 1) 키보드 내리기
    if (dismissKeyboardOnPress) Keyboard.dismiss();

    // 2) (옵션) 스냅 원복
    if (snapToIndexOnTouchInside) {
      const fn = modalRef?.current?.snapToIndex;
      if (typeof fn === 'function') fn(snapIndexOnTouchInside);
    }

    // 3) 자식 reset 콜백
    onTouchInside?.();
  }, [
    dismissKeyboardOnPress,
    snapToIndexOnTouchInside,
    snapIndexOnTouchInside,
    modalRef,
    onTouchInside,
  ]);

  return (
    <BottomSheetModal
      ref={modalRef}
      handleIndicatorStyle={{
        width: getResponsiveHeight(35),
        backgroundColor: COLORS.textTertiary,
      }}
      snapPoints={resolvedSnapPoints}
      enableDynamicSizing={false}
      enableContentPanningGesture={enableContentPanningGesture}
      animationConfigs={animationConfigs}
      keyboardBehavior={keyboardBehavior}
      androidKeyboardInputMode={androidKeyboardInputMode}
      backdropComponent={renderBackdrop}
      onDismiss={handleDismiss}
      enablePanDownToClose={true}>
      <BottomSheetView
        style={[
          styles.container,
          {flex: 1},
          {paddingBottom: safeBottom, maxHeight: WINDOW_H},
          containerStyle,
        ]}>
        {(title || subtitle) && (
          <View style={[styles.header, headerStyle]}>
            {!!title && (
              <Text allowFontScaling={false} style={styles.title}>
                {title}
              </Text>
            )}
            {!!subtitle && (
              <Text allowFontScaling={false} style={styles.subtitle}>
                {subtitle}
              </Text>
            )}
          </View>
        )}

        {/* ✅ 여기부터가 핵심: "빈 공간 탭"만 잡는 구조
            - 아래: Pressable (탭 캐처)
            - 위: 실제 컨텐츠 (pointerEvents="box-none"로 View는 터치 안 먹고 자식만 터치 받게)
            - 자식이 터치를 받으면 Pressable로 떨어지지 않는 케이스가 대부분이라 스크롤/버튼이 살아남
        */}
        <View style={{flex: 1}}>
          {/* 1) 배경 탭 캐처 */}
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={handleTouchInside}
          />

          {/* 2) 실제 컨텐츠 레이어 */}
          <View style={{flex: 1}} pointerEvents="box-none">
            {useInternalScroll ? (
              <BottomSheetScrollView
                style={[styles.scrollWrap, {flex: 1}, innerContentStyle]}
                contentContainerStyle={[
                  styles.scrollContent,
                  {flexGrow: 1},
                  contentStyle,
                ]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="always"
                keyboardDismissMode="none">
                {/* Animated.View는 box-none으로 두면 내부 터치 방해 덜함 */}
                <Animated.View
                  style={animatedContentStyle}
                  pointerEvents="box-none">
                  {children}
                </Animated.View>
              </BottomSheetScrollView>
            ) : (
              <Animated.View
                style={[animatedContentStyle, {flex: 1}, innerContentStyle]}
                pointerEvents="box-none">
                {children}
              </Animated.View>
            )}
          </View>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: getResponsiveHeight(12),
    paddingHorizontal: getResponsiveWidth(16),
  },

  header: {
    paddingBottom: getResponsiveHeight(10),
  },
  title: {
    fontFamily: BOTTOMSHEET_STYLE()?.title?.fontFamily || 'Pretendard-SemiBold',
    fontSize: BOTTOMSHEET_STYLE()?.title?.fontSize || getResponsiveFontSize(16),
    color: BOTTOMSHEET_STYLE()?.title?.color || '#111827',
    letterSpacing: -0.2,
  },
  subtitle: {
    marginTop: getResponsiveHeight(3),
    fontFamily: BOTTOMSHEET_STYLE()?.subtitle?.fontFamily || 'Pretendard-Medium',
    fontSize:
      BOTTOMSHEET_STYLE()?.subtitle?.fontSize || getResponsiveFontSize(12.5),
    color: BOTTOMSHEET_STYLE()?.subtitle?.color || '#6B7280',
    lineHeight: getResponsiveFontSize(18),
  },

  scrollWrap: {},
  scrollContent: {
    paddingTop: getResponsiveHeight(2),
    paddingBottom: getResponsiveHeight(6),
  },

  animatedContent: {
    minHeight: Platform.OS === 'android' ? 1 : undefined,
  },
});
