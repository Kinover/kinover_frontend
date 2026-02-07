/**
 * @format
 */
import 'react-native-gesture-handler'; // ✅ 가장 위
import 'react-native-reanimated'; // ✅ 두 번째 (프로젝트에서 이 방식 쓰고 있으면 유지)
import './src/app/disableFontScaling';

import {AppRegistry} from 'react-native';
import {name as appName} from './app.json';
import App from './src/app/App';
import {registerBackgroundMessageHandler} from './src/features/notification/utils/requestNotificationPermission';

// ✅ polyfill
if (!Array.prototype.findLastIndex) {
  // eslint-disable-next-line no-extend-native
  Object.defineProperty(Array.prototype, 'findLastIndex', {
    value: function (predicate, thisArg) {
      if (this == null) throw new TypeError('"this" is null or not defined');
      const o = Object(this);
      const len = o.length >>> 0;
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }
      for (let k = len - 1; k >= 0; k--) {
        const kValue = o[k];
        if (predicate.call(thisArg, kValue, k, o)) {
          return k;
        }
      }
      return -1;
    },
  });
}

// ✅ FCM 백그라운드 핸들러 등록 (한 번만)
registerBackgroundMessageHandler();

// ✅ 앱 등록도 한 번만
AppRegistry.registerComponent(appName, () => App);
