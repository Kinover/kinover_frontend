// src/app/disableFontScaling.js
import {Text, TextInput} from 'react-native';
import {Text as GHText, TextInput as GHTextInput} from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

console.log('[disableFontScaling] loaded');

// reanimated 쪽 AnimatedText 잡기 (버전에 따라 경로 다름)
let Reanimated;
try {
  // eslint-disable-next-line global-require
  Reanimated = require('react-native-reanimated');
} catch (e) {
  Reanimated = null;
}

const setNoScale = Comp => {
  if (!Comp) return;
  if (Comp.defaultProps == null) Comp.defaultProps = {};
  Comp.defaultProps.allowFontScaling = false;
};

setNoScale(Text);
setNoScale(TextInput);

// RNGH
setNoScale(GHText);
setNoScale(GHTextInput);

// RN Animated.Text (Animated.Text는 "컴포넌트"라 defaultProps 적용 가능)
setNoScale(Animated.Text);

// Reanimated Animated.Text (가능하면 같이)
if (Reanimated?.default?.Text) setNoScale(Reanimated.default.Text);
if (Reanimated?.Text) setNoScale(Reanimated.Text);
