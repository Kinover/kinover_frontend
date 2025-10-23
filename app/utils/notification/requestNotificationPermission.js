// notification/requestNotificationPermission.js

import { PermissionsAndroid, Platform, Alert } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import axios from 'axios';
import { getToken as getJWT } from '../../utils/storage';
import { navigate } from '../../navigation/navigationRef';

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

// 🔁 토큰 재시도 유틸 (최대 5회, 1s 간격)
async function getFcmTokenWithRetry(maxTry = 5, delayMs = 1000) {
  for (let i = 1; i <= maxTry; i++) {
    try {
      const t = await messaging().getToken();
      if (t) return t;
    } catch {}
    await new Promise(r => setTimeout(r, delayMs));
  }
  return null;
}

// FCM 토큰 → 서버 전송
export async function getFcmTokenAndSend(userId) {
  try {
    const fcmToken = await getFcmTokenWithRetry();
    console.log('[FCM] token:', fcmToken);

    if (!fcmToken) {
      console.warn('⚠️ FCM 토큰이 비어 있음. (실기기/권한/APNs Key/Bundle ID 확인)');
      return;
    }

    const accessToken = await getJWT();
    if (!accessToken) {
      console.warn('⚠️ JWT 없음 → 로그인 후 재시도');
      return;
    }

    const res = await axios.post(
      SERVER_URL,
      { fcmToken, userId }, // 서버 스키마에 맞게 필드명 확인
      { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } },
    );
    console.log('✅ 서버 전송 성공:', res.status);
  } catch (err) {
    console.log('❌ 서버 전송 실패 status:', err?.response?.status);
    console.log('❌ data:', err?.response?.data);
    console.log('❌ msg:', err?.message);
  }
}

// 포그라운드/클릭/토큰갱신 리스너 (구독 해제 함수 반환)

export function handleNotificationListeners() {
  const unsubOnMessage = messaging().onMessage(async m => {
    // ✅ 새 알림 빨간 점 표시
    store.dispatch(setHasUnread(true));
    Alert.alert(m.notification?.title || '알림', m.notification?.body || '알림 내용 없음');
  });

  const unsubOpened = messaging().onNotificationOpenedApp(() => {
    navigate('알림화면'); // 네이게이션 스택 이름 맞게 수정!
    store.dispatch(setHasUnread(false)); // ✅ 알림 확인 → 빨간 점 해제
  });

  messaging().getInitialNotification().then(m => {
    if (m) {
      navigate('알림화면');
      store.dispatch(setHasUnread(false));
    }
  });

  const unsubTokenRefresh = messaging().onTokenRefresh(async token => {
    const accessToken = await getJWT();
    if (!accessToken) return;
    try {
      await axios.post(
        SERVER_URL,
        { fcmToken: token },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      console.log('🔄 갱신 토큰 서버 반영 성공');
    } catch (e) {
      console.log('🔄 갱신 토큰 전송 실패', e);
    }
  });

  return () => {
    try { unsubOnMessage(); } catch {}
    try { unsubOpened(); } catch {}
    try { unsubTokenRefresh(); } catch {}
  };
}

// 백그라운드/종료 상태 데이터 메시지 처리 등록 (index.js에서 "한 번" 호출)
export function registerBackgroundMessageHandler() {
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    try {
      const data  = remoteMessage?.data || {};
      const title = remoteMessage?.notification?.title || data.title || '알림';
      const body  = remoteMessage?.notification?.body  || data.body  || '새 소식이 있어요';

      console.log('[BG] messageId:', remoteMessage?.messageId);
      console.log('[BG] data:', data);

      // (선택) 데이터-only일 때 배너 띄우려면 notifee 사용 가능
      const notifee = (await import('@notifee/react-native')).default;
      const channelId = Platform.OS === 'android'
        ? await notifee.createChannel({ id: 'default', name: 'Default' })
        : undefined;
      await notifee.displayNotification({
        title, body,
        android: channelId ? { channelId } : undefined,
        data,
      });
    } catch (e) {
      console.log('[BG] handler error:', e);
    }
  });
}

// FCM 토큰 삭제
export async function deleteFcmToken() {
  try {
    await messaging().deleteToken();
    console.log('🗑️ FCM 토큰 삭제 완료');

    // 서버에도 반영해주기 (선택)
    // const accessToken = await getJWT();
    // if (accessToken) {
    //   await axios.post(
    //     `${SERVER_URL}/delete`, // 서버에 맞는 삭제 엔드포인트 필요
    //     {},
    //     { headers: { Authorization: `Bearer ${accessToken}` } },
    //   );
    //   console.log('🗑️ 서버 토큰 삭제 반영 완료');
    // }
  } catch (err) {
    console.log('❌ FCM 토큰 삭제 실패:', err);
  }
}