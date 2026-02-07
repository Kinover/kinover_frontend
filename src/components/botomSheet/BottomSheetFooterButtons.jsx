// src/components/botomSheet/BottomSheetFooterButtons.jsx
/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {View} from 'react-native';
import {BottomSheetButtons} from 'components/botomSheet/BottomSheetButtons';

/**
 * ✅ footer 버튼 영역을 통일하기 위한 공통 컴포넌트
 *
 * - UI: bottomSafe padding을 footer에 적용
 * - 측정: 훅(useMeasuredSnapPoints)에는 safe 제외한 높이를 전달(excludeSafeForMeasure)
 *
 * 규칙:
 * 1) includeBottomSafePadding=true면 UI paddingBottom에 bottomSafe를 준다.
 * 2) excludeSafeForMeasure=true면 onLayoutHeight에는 (h - bottomSafe)를 전달한다.
 */
export default function BottomSheetFooterButtons({
  onLayoutHeight, // (h:number)=>void
  bottomSafe = 0,
  includeBottomSafePadding = true,

  // ✅ 훅 측정치로 넘길 때 safe 제외할지(중복 더해짐 방지)
  excludeSafeForMeasure = true,

  // ✅ 버튼 아래 추가 숨통(선택)
  bottomGap = 0,

  style,
  ...buttonProps
}) {
  const safe = includeBottomSafePadding ? Number(bottomSafe || 0) : 0;

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
