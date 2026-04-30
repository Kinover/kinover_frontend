import React from 'react';
import Svg, {Line} from 'react-native-svg';

/**
 * 벡터 아이콘 폰트(Ionicons 등) 미링크 시 ? 로 깨지는 문제를 피하기 위해
 * SVG로만 그림 — BottomSheet 헤더 닫기 전용.
 */
export default function SheetHeaderCloseIcon({
  size = 16,
  color = '#374151',
}) {
  const inset = size * 0.22;
  const stroke = Math.max(1.75, size * 0.095);

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Line
        x1={inset}
        y1={inset}
        x2={size - inset}
        y2={size - inset}
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      <Line
        x1={size - inset}
        y1={inset}
        x2={inset}
        y2={size - inset}
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
      />
    </Svg>
  );
}
