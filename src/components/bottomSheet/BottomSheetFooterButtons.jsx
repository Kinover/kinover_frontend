// src/components/bottomSheet/BottomSheetFooterButtons.jsx
/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {View, Platform} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {BottomSheetButtons} from 'components/bottomSheet/BottomSheetButtons';
import {getAndroidBottomSheetFooterInsetPx} from 'utils/layoutMetrics';

/**
 * footer 버튼 영역을 통일하기 위한 공통 컴포넌트
 *
 * - useSafeAreaInsets로 하단 인셋 사용
 * - Android: getAndroidBottomSheetFooterInsetPx (화면 추정 + 56dp fallback + 24dp 버퍼)
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

  const safe = includeBottomSafePadding
    ? Platform.OS === 'android'
      ? getAndroidBottomSheetFooterInsetPx(rawBottom, bottomSafe)
      : Math.max(Number(bottomSafe || 0), rawBottom)
    : 0;

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
