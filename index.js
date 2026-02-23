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

// ✅ 폴리필은 별도 모듈에서 적용 (표준 방식)
import './src/utils/polyfills';

// ✅ FCM 백그라운드 핸들러 등록 (한 번만)
registerBackgroundMessageHandler();

// ✅ 앱 등록도 한 번만
AppRegistry.registerComponent(appName, () => App);
