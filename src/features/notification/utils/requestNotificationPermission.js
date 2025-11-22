// notification/requestNotificationPermission.js
import store from 'store/store';
import {PermissionsAndroid, Platform} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import axios from 'axios';
import {getToken as getJWT} from '../../../utils/storage';
import {navigate} from '../../../app/navigation/navigationRef';
import {setHasUnread} from '../store/notificationSlice';

// 🔥 추가: ToastModal 컨트롤용 (전역 함수로 간단 적용)
let toastHandler = null;
export const setNotificationToastHandler = handler => {
  toastHandler = handler;
};
const showToast = msg => {
  toastHandler && toastHandler(msg);
};

const SERVER_URL = 'https://kinover.shop/api/fcm/register';

export async function requestNotificationPermission() {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      {
        title: '알림 권한 요청',
        message: '알림을 보내기 위해 권한이 필요해요!',
        buttonPositive: '확인',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }

  // iOS
  const auth = await messaging().requestPermission();
  const ok =
    auth === messaging.AuthorizationStatus.AUTHORIZED ||
    auth === messaging.AuthorizationStatus.PROVISIONAL;

  if (ok) {
    try {
      await messaging().setAutoInitEnabled(true);
      await messaging().registerDeviceForRemoteMessages();
      const apns = await messaging().getAPNSToken();
      console.log('[iOS] APNs token:', apns);
    } catch (e) {
      console.log('[iOS] register/init error:', e);
    }
  }
  return ok;
}

// 🔁 FCM 토큰 재시도
async function getFcmTokenWithRetry(maxTry = 5, delayMs = 1000) {
  for (let i = 1; i <= maxTry; i++) {
    try {
      const t = await messaging().getToken();
      if (t) return t;
    } catch {
      null;
    }
    await new Promise(r => setTimeout(r, delayMs));
  }
  return null;
}

// FCM 토큰 → 서버 전송
export async function getFcmTokenAndSend(userId) {
  try {
    const fcmToken = await getFcmTokenWithRetry();

    if (!fcmToken) {
      showToast('FCM 토큰을 가져올 수 없어요.');
      return;
    }

    const accessToken = await getJWT();
    if (!accessToken) {
      showToast('로그인 후 다시 시도해주세요.');
      return;
    }

    const res = await axios.post(
      SERVER_URL,
      {fcmToken, userId},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );
    console.log('✅ 서버 전송 성공:', res.status);
  } catch (err) {
    console.log('❌ 서버 전송 실패:', err?.response);
    showToast('서버 전송 중 오류가 발생했어요.');
  }
}

// 🔔 포그라운드/클릭/갱신 리스너
export function handleNotificationListeners() {
  // 앱 열려있는 상태에서 알림 받음
  const unsubOnMessage = messaging().onMessage(async m => {
    store.dispatch(setHasUnread(true));

    const title = m.notification?.title ?? '알림';
    const body = m.notification?.body ?? '새로운 알림이 도착했어요';

    showToast(`${title}: ${body}`);
  });

  // 알림 클릭 → 앱 열림
  const unsubOpened = messaging().onNotificationOpenedApp(() => {
    store.dispatch(setHasUnread(false));
    navigate('알림화면');
  });

  // 앱 종료 상태에서 알림 클릭
  messaging()
    .getInitialNotification()
    .then(m => {
      if (m) {
        store.dispatch(setHasUnread(false));
        navigate('알림화면');
      }
    });

  // 🔄 토큰 갱신
  const unsubTokenRefresh = messaging().onTokenRefresh(async token => {
    const accessToken = await getJWT();
    if (!accessToken) return;

    try {
      await axios.post(
        SERVER_URL,
        {fcmToken: token},
        {headers: {Authorization: `Bearer ${accessToken}`}},
      );
    } catch (e) {
      console.log('토큰 갱신 실패:', e);
      showToast('알림 토큰 갱신에 실패했어요.');
    }
  });

  return () => {
    try {
      unsubOnMessage();
    } catch {
      null;
    }
    try {
      unsubOpened();
    } catch {
      null;
    }
    try {
      unsubTokenRefresh();
    } catch {
      null;
    }
  };
}

// 백그라운드 메시지 처리
export function registerBackgroundMessageHandler() {
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    try {
      console.log('[BG] background message:', remoteMessage);
      // notifee로 배너 표시 (데이터-only 경우)
      const notifee = (await import('@notifee/react-native')).default;
      const channelId =
        Platform.OS === 'android'
          ? await notifee.createChannel({id: 'default', name: 'Default'})
          : undefined;

      await notifee.displayNotification({
        title:
          remoteMessage?.notification?.title ||
          remoteMessage?.data?.title ||
          '알림',
        body:
          remoteMessage?.notification?.body ||
          remoteMessage?.data?.body ||
          '새 소식이 있어요',
        android: channelId ? {channelId} : undefined,
      });
    } catch (e) {
      console.log('[BG] handler error:', e);
    }
  });
}

// FCM 토큰 제거
export async function deleteFcmToken() {
  try {
    await messaging().deleteToken();
    console.log('🗑️ FCM 토큰 삭제 완료');
    showToast('푸시 알림 토큰이 삭제되었어요.');
  } catch (err) {
    console.log('❌ FCM 토큰 삭제 실패:', err);
    showToast('토큰 삭제 중 문제가 발생했어요.');
  }
}
