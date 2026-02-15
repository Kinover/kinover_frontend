/**
 * @fileoverview 폰트 스케일링 비활성화 유틸리티
 * 
 * 시스템 폰트 크기 설정에 따라 텍스트가 자동으로 크기가 변경되는 것을 방지합니다.
 * React Native, Gesture Handler, Reanimated의 모든 Text 컴포넌트에 적용됩니다.
 */

import {Text, TextInput} from 'react-native';
import {
  Text as GHText,
  TextInput as GHTextInput,
} from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

// ==================== Utils ====================

/**
 * 컴포넌트의 기본 폰트 스케일링 비활성화
 * @param {React.ComponentType} Comp - 컴포넌트 타입
 */
const setNoScale = Comp => {
  if (!Comp) return;
  if (Comp.defaultProps == null) {
    Comp.defaultProps = {};
  }
  Comp.defaultProps.allowFontScaling = false;
};

/**
 * Reanimated 모듈 동적 로드 (버전에 따라 경로가 다를 수 있음)
 */
let Reanimated;
try {
  // eslint-disable-next-line global-require
  Reanimated = require('react-native-reanimated');
} catch (e) {
  Reanimated = null;
}

// ==================== Apply Font Scaling Disable ====================

// React Native 기본 컴포넌트
setNoScale(Text);
setNoScale(TextInput);

// React Native Gesture Handler 컴포넌트
setNoScale(GHText);
setNoScale(GHTextInput);

// React Native Animated Text
setNoScale(Animated.Text);

// React Native Reanimated Text (버전별 경로 처리)
if (Reanimated?.default?.Text) {
  setNoScale(Reanimated.default.Text);
}
if (Reanimated?.Text) {
  setNoScale(Reanimated.Text);
}
