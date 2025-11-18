/**
 * @format
 */
import 'react-native-gesture-handler'; // ✅ 가장 위
import 'react-native-reanimated'; // ✅ 두 번째로 위
import {AppRegistry} from 'react-native';
import {name as appName} from './app.json';
// import {registerBackgroundMessageHandler } from './app/screens/notification/requestNotificationPermission';
import MyApp from './src/features/_layout';
import { registerBackgroundMessageHandler } from './src/features/notification/utils/requestNotificationPermission';

registerBackgroundMessageHandler();

if (!Array.prototype.findLastIndex) {
    // eslint-disable-next-line no-extend-native
    Object.defineProperty(Array.prototype, 'findLastIndex', {
      value: function(predicate, thisArg) {
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
AppRegistry.registerComponent(appName, () => MyApp);
