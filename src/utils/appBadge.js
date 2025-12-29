// src/utils/appBadge.js
import {Platform} from 'react-native';

export async function applyAppBadgeCount(raw) {
  const n =
    Number.isFinite(Number(raw)) && Number(raw) >= 0
      ? Math.trunc(Number(raw))
      : 0;

  // 1) notifee (Android/iOS 배지 가장 안정적)
  try {
    const notifee = require('@notifee/react-native').default;
    if (notifee?.setBadgeCount) {
      await notifee.setBadgeCount(n);
      return n;
    }
  } catch (e) {
    // notifee 미사용이면 무시
  }

  // 2) iOS fallback
  if (Platform.OS === 'ios') {
    try {
      const PushNotificationIOS =
        require('@react-native-community/push-notification-ios').default;
      PushNotificationIOS?.setApplicationIconBadgeNumber?.(n);
    } catch (e) {
      null;
    }
  }

  return n;
}
