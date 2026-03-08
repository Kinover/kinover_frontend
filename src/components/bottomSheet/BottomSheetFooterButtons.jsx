// src/components/bottomSheet/BottomSheetFooterButtons.jsx
/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {View, Platform} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {getResponsiveHeight} from 'utils/responsive';
import {BottomSheetButtons} from 'components/bottomSheet/BottomSheetButtons';
import {getAndroidNavBottomInsetEstimate} from 'utils/layoutMetrics';

/**
 * Android에서 insets.bottom이 0이어도 시스템 내비게이션 바 높이만큼 최소 여백 확보
 * - 갤럭시 S22 등 제스처 네비게이션 기기에서 하단 버튼이 가려지는 이슈가 있어
 * fallback/버퍼를 조금 더 넉넉하게(56dp + 24dp) 잡음.
 */
const ANDROID_NAV_FALLBACK = getResponsiveHeight(56);
const ANDROID_FOOTER_BUFFER = getResponsiveHeight(24);

/**
 * footer 버튼 영역을 통일하기 위한 공통 컴포넌트
 *
 * - useSafeAreaInsets로 하단 인셋 사용
 * - Android: insets.bottom이 0이면 fallback(48dp) 적용 후 16dp 버퍼 추가 → 내비게이션 바에 버튼 가림 방지
 */
export default function BottomSheetFooterButtons({
  onLayoutHeight,
  bottomSafe = 0,
  includeBottomSafePadding = true,

  excludeSafeForMeasure = true,

  bottomGap = 0,

  style,
  ...buttonProps
}) {
  const insets = useSafeAreaInsets();
  const rawBottom = Number(insets?.bottom ?? 0);
  const androidInsetByScreen = getAndroidNavBottomInsetEstimate();
  const androidMinBottom =
    Platform.OS === 'android'
      ? Math.max(rawBottom, androidInsetByScreen, ANDROID_NAV_FALLBACK)
      : rawBottom;

  const baseSafe = includeBottomSafePadding
    ? Math.max(Number(bottomSafe || 0), androidMinBottom)
    : 0;
  const androidExtra = Platform.OS === 'android' ? ANDROID_FOOTER_BUFFER : 0;
  const safe = baseSafe + androidExtra;

  return (
    <View
      collapsable={false}
      onLayout={e => {
        const h = Number(e?.nativeEvent?.layout?.height ?? 0);
        const measured = excludeSafeForMeasure ? Math.max(0, h - safe) : h;
        onLayoutHeight?.(measured);
      }}
      style={[style, safe > 0 && {paddingBottom: safe}]}>
      <BottomSheetButtons {...buttonProps} />
      {bottomGap > 0 ? <View style={{height: bottomGap}} /> : null}
    </View>
  );
}
