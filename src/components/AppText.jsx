import React from 'react';
import {Text} from 'react-native';

/**
 * 접근성/폰트 스케일 표준 컴포넌트
 * - allowFontScaling: RN 기본값(true) 유지
 * - maxFontSizeMultiplier로 시스템 폰트 스케일 상한 제어
 */
export default function AppText({maxFontSizeMultiplier = 1.3, ...props}) {
  return <Text maxFontSizeMultiplier={maxFontSizeMultiplier} {...props} />;
}

