import React, {forwardRef, useMemo} from 'react';
import {Animated, Text} from 'react-native';
import {getResponsiveFontSize} from 'utils/responsive';
import {useReduxFontMode} from 'hooks/useReduxFontMode';

/**
 * 앱 글씨 크기(fontMode)와 동일한 규칙으로 스케일되는 텍스트.
 * - `size`(피그마·디자인 기준 px): `getResponsiveFontSize`를 렌더 시 적용 (설정 변경 시 갱신)
 * - OS 접근성 글자 크기는 전역 `disableFontScaling` 정책과 맞추기 위해 기본 false
 *
 * Redux `<Provider>` 밖에서도 `useReduxFontMode`가 크래시 없이 동작합니다.
 *
 * `size` 없이 style만 쓰면 기존과 같이 고정 fontSize일 수 있으니, 반드시 `size` 또는
 * `useScaledStyleSheet`로 폰트를 주는 편이 안전합니다.
 */
const AppText = forwardRef(function AppText(
  {
    size,
    fontSizeOptions,
    style,
    allowFontScaling = false,
    maxFontSizeMultiplier = 1,
    ...props
  },
  ref,
) {
  const fontMode = useReduxFontMode();

  const scaled = useMemo(() => {
    if (size == null) return null;
    const n = typeof size === 'number' ? size : Number(size);
    if (!Number.isFinite(n)) return null;
    return {
      fontSize: getResponsiveFontSize(n, fontSizeOptions ?? {}),
    };
  }, [size, fontSizeOptions, fontMode]);

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

/** RN Animated + 앱 글씨 크기(fontMode) 동기화 */
export const AnimatedAppText = Animated.createAnimatedComponent(AppText);

export default AppText;
