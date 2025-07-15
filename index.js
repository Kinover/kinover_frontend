/**
 * @format
 */
import 'react-native-gesture-handler'; // ✅ 가장 위
import 'react-native-reanimated'; // ✅ 두 번째로 위
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
