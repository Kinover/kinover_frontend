import React, {forwardRef, useMemo} from 'react';
import {Animated, Text} from 'react-native';
import {getResponsiveFontSize} from 'utils/responsive';

/**
 * 디바이스 너비 기준으로 스케일되는 텍스트 컴포넌트.
 * - `size`(피그마 기준 px): `getResponsiveFontSize` 적용
 * - OS 접근성 글자 크기를 허용해 WCAG 1.4.4(200% 텍스트 크기 조정)를 준수합니다.
 */
const AppText = forwardRef(function AppText(
  {
    size,
    fontSizeOptions,
    style,
    allowFontScaling = true,
    maxFontSizeMultiplier = 2,
    ...props
  },
  ref,
) {
  const scaled = useMemo(() => {
    if (size == null) return null;
    const n = typeof size === 'number' ? size : Number(size);
    if (!Number.isFinite(n)) return null;
    return {
      fontSize: getResponsiveFontSize(n, fontSizeOptions ?? {}),
    };
  }, [size, fontSizeOptions]);

  return (
    <Text
      ref={ref}
      allowFontScaling={allowFontScaling}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[scaled, style]}
      {...props}
    />
  );
});

AppText.displayName = 'AppText';

/** RN Animated 용 AppText 래퍼 */
export const AnimatedAppText = Animated.createAnimatedComponent(AppText);

export default AppText;
