// notification/requestNotificationPermission.js
import store from 'store/store';
import {PermissionsAndroid, Platform, AppState} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import axios from 'axios';
import {getToken as getJWT} from '../../../utils/storage';
import {navigate} from '../../../app/navigation/navigationRef';

import {
  fetchUnreadCountThunk,
  fetchHasUnreadThunk,
} from '../store/notificationThunk';

// 🔥 ToastModal 컨트롤용
let toastHandler = null;
export const setNotificationToastHandler = handler => {
  toastHandler = handler;
};
const showToast = msg => {
  toastHandler && toastHandler(msg);
};

const BASE = 'https://kinover.shop/api';
const REGISTER_URL = `${BASE}/fcm/register`;

// ✅ 리스너 중복 방지 (중복 토스트/중복 동기화 방지)
let listenersAttached = false;

export async function requestNotificationPermission() {
  if (Platform.OS === 'android') {
    // ✅ Android 13(API 33) 미만은 런타임 알림 권한이 없음
    const apiLevel = Number(Platform.Version) || 0;
    if (apiLevel < 33) return true;

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

// ✅ FCM 토큰 → 서버 전송 (백 컨트롤러에 맞게 fcmToken만)
export async function getFcmTokenAndSend() {
  try {
    // ✅ RNFB 권장: 토큰 얻기 전에 등록 보장(특히 iOS)
    try {
      await messaging().registerDeviceForRemoteMessages();
    } catch {
      null;
    }

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
      REGISTER_URL,
      {fcmToken},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );
    console.log('✅ FCM 토큰 서버 등록 성공:', res.status);
  } catch (err) {
    console.log('❌ FCM 토큰 서버 등록 실패:', err?.response || err);
    showToast('서버 전송 중 오류가 발생했어요.');
  }
}

// remoteMessage -> open용 객체로 정규화
function normalizeRemoteMessage(remoteMessage) {
  const data = remoteMessage?.data || {};
  const notificationType = data.notificationType || data.type;

  return {
    notificationType,
    postId: data.postId || null,
    commentId: data.commentId || null,
    chatRoomId: data.chatRoomId || null,
    scheduleId: data.scheduleId || null,
  };
}

// ✅ 원래 구조 유지 + 안전성만 보강
function openFromRemoteMessage(remoteMessage) {
  const n = normalizeRemoteMessage(remoteMessage);

  if (!n?.notificationType) {
    navigate('알림화면');
    return;
  }

  switch (n.notificationType) {
    case 'POST':
    case 'COMMENT':
    case 'MENTION_COMMENT': {
      if (!n.postId) {
        navigate('알림화면');
        return;
      }
      navigate('Tabs', {
        screen: '추억',
        params: {
          screen: '게시글화면',
          params: {
            postId: n.postId,
            highlightCommentId: n.commentId || null,
          },
        },
      });
      return;
    }

    case 'CHAT':
    case 'MENTION_CHAT': {
      if (!n.chatRoomId) {
        navigate('Tabs', {screen: '소통'});
        return;
      }
      navigate('Tabs', {
        screen: '소통',
        params: {
          screen: '채팅방화면',
          params: {chatRoomId: n.chatRoomId},
        },
      });
      return;
    }

    case 'SCHEDULE': {
      // 프로젝트 라우트가 따로 있으면 여기만 맞춰주면 됨
      navigate('Tabs', {screen: '일정'});
      return;
    }

    default:
      navigate('알림화면');
  }
}

// ✅ 서버 기준으로 빨간점/뱃지 동기화
async function syncUnreadFromServer() {
  try {
    // unreadCount 기준으로 hasUnread도 맞춰지긴 하지만,
    // 서버 기준이 미묘하게 다를 수 있어서 둘 다 동기화(안전)
    store.dispatch(fetchUnreadCountThunk());
    store.dispatch(fetchHasUnreadThunk());
  } catch {
    null;
  }
}

// 🔔 포그라운드/클릭/갱신 리스너
export function handleNotificationListeners() {
  // ✅ 중복 등록 방지
  if (listenersAttached) return () => {};
  listenersAttached = true;

  // ✅ 앱 시작 시 1회 동기화
  syncUnreadFromServer();

  // ✅ 포그라운드 전환 시에도 동기화
  const appStateSub = AppState.addEventListener('change', nextState => {
    if (nextState === 'active') {
      syncUnreadFromServer();
    }
  });

  // 앱 열려있는 상태에서 알림 받음
  const unsubOnMessage = messaging().onMessage(async m => {
    await syncUnreadFromServer();

    // ✅ data-only 메시지까지 커버
    const title = m.notification?.title ?? m.data?.title ?? '알림';
    const body =
      m.notification?.body ?? m.data?.body ?? '새로운 알림이 도착했어요';
    showToast(`${title}: ${body}`);
  });

  // 알림 클릭 → 앱 열림 (읽음 확정 X, 이동만)
  const unsubOpened = messaging().onNotificationOpenedApp(
    async remoteMessage => {
      await syncUnreadFromServer();
      openFromRemoteMessage(remoteMessage);
    },
  );

  // 앱 종료 상태에서 알림 클릭
  messaging()
    .getInitialNotification()
    .then(async remoteMessage => {
      if (remoteMessage) {
        await syncUnreadFromServer();
        openFromRemoteMessage(remoteMessage);
      }
    });

  // 🔄 토큰 갱신
  const unsubTokenRefresh = messaging().onTokenRefresh(async token => {
    const accessToken = await getJWT();
    if (!accessToken) return;

    try {
      await axios.post(
        REGISTER_URL,
        {fcmToken: token},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
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
    try {
      appStateSub?.remove?.();
    } catch {
      null;
    }

    // ✅ cleanup 시 다시 attach 가능하게
    listenersAttached = false;
  };
}

// 백그라운드 메시지 처리
export function registerBackgroundMessageHandler() {
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    try {
      console.log('[BG] background message:', remoteMessage);

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
