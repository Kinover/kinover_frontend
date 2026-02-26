// 시스템 폰트 키우면 앱 글자까지 다 커져서 끔
import {Text, TextInput} from 'react-native';
import {
  Text as GHText,
  TextInput as GHTextInput,
} from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

const setNoScale = Comp => {
  if (!Comp) return;
  if (Comp.defaultProps == null) {
    Comp.defaultProps = {};
  }
  Comp.defaultProps.allowFontScaling = false;
};

// Reanimated 버전에 따라 경로 달라질 수 있음
let Reanimated;
try {
  // eslint-disable-next-line global-require
  Reanimated = require('react-native-reanimated');
} catch (e) {
  Reanimated = null;
}

setNoScale(Text);
setNoScale(TextInput);

setNoScale(GHText);
setNoScale(GHTextInput);

setNoScale(Animated.Text);

if (Reanimated?.default?.Text) {
  setNoScale(Reanimated.default.Text);
}
if (Reanimated?.Text) {
  setNoScale(Reanimated.Text);
}
