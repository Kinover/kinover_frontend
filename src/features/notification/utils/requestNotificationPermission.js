// notification/requestNotificationPermission.js
import store from 'store/store';
import {
  PermissionsAndroid,
  Platform,
  AppState,
  InteractionManager,
} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import axios from 'axios';
import {getToken as getJWT} from '../../../utils/storage';
import {navigate, navigationRef} from '../../../app/navigation/navigationRef';

import {CommonActions} from '@react-navigation/native';

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

// ✅ 리스너 중복 방지
let listenersAttached = false;

/**
 * ✅ 네비 준비 전 이동 방지용
 */
async function safeNavigate(fn, maxTry = 20, delayMs = 120) {
  await new Promise(resolve => {
    InteractionManager.runAfterInteractions(resolve);
  });

  for (let i = 0; i < maxTry; i++) {
    try {
      const ready = navigationRef?.isReady?.() === true;
      if (!ready) {
        await new Promise(r => setTimeout(r, delayMs));
        continue;
      }

      fn?.();
      return;
    } catch {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }

  try {
    navigate('알림화면');
  } catch {
    null;
  }
}

/**
 * ✅ Tabs 안의 중첩 스택 이동 강제 디스패치
 */
function dispatchTabsNavigate(params) {
  const action = CommonActions.navigate({
    name: 'Tabs',
    params,
  });
  navigationRef.dispatch(action);
}

/**
 * ✅ 타입 통일(중요!)
 */
const toStr = v => (v == null ? null : String(v));

/**
 * ✅ 서버 기준 "종(bell)" 뱃지/빨간점만 동기화
 * - ⚠️ 채팅 푸시(CHAT / MENTION_CHAT)로는 절대 호출하면 안 됨
 */
async function syncBellUnreadFromServer() {
  try {
    await store.dispatch(fetchUnreadCountThunk()); // bell unreadCount
    store.dispatch(fetchHasUnreadThunk()); // bell hasUnread
  } catch {
    null;
  }
}

/**
 * ✅ 푸시 타입 정규화
 */
function normalizeRemoteMessage(remoteMessage) {
  const data = remoteMessage?.data || {};
  const rawType = data.notificationType || data.type;
  const notificationType = rawType ? String(rawType).toUpperCase() : null;

  return {
    notificationType,
    postId: toStr(data.postId),
    commentId: toStr(data.commentId),
    chatRoomId: toStr(data.chatRoomId),
    scheduleId: toStr(data.scheduleId),
  };
}

function isChatType(type) {
  return type === 'CHAT' || type === 'MENTION_CHAT';
}

function isBellType(type) {
  return type === 'POST' || type === 'COMMENT' || type === 'MENTION_COMMENT';
}

function openFromRemoteMessage(remoteMessage) {
  const n = normalizeRemoteMessage(remoteMessage);

  console.log('[PUSH OPENED data]', remoteMessage?.data);
  console.log('[PUSH normalized]', n);

  // ✅ notificationType 없으면 알림화면
  if (!n?.notificationType) {
    safeNavigate(() => navigate('알림화면'));
    return;
  }

  switch (n.notificationType) {
    case 'POST':
    case 'COMMENT':
    case 'MENTION_COMMENT': {
      if (!n.postId) {
        safeNavigate(() => navigate('알림화면'));
        return;
      }

      safeNavigate(() =>
        dispatchTabsNavigate({
          screen: '추억',
          params: {
            screen: '게시글화면',
            params: {
              postId: n.postId,
              highlightCommentId: n.commentId || null,
            },
          },
        }),
      );
      return;
    }

    case 'CHAT':
    case 'MENTION_CHAT': {
      if (!n.chatRoomId) {
        safeNavigate(() =>
          dispatchTabsNavigate({
            screen: '소통',
          }),
        );
        return;
      }

      safeNavigate(() =>
        dispatchTabsNavigate({
          screen: '소통',
          params: {
            screen: '채팅방화면',
            params: {chatRoomId: n.chatRoomId},
          },
        }),
      );
      return;
    }

    case 'SCHEDULE': {
      safeNavigate(() =>
        dispatchTabsNavigate({
          screen: '일정',
        }),
      );
      return;
    }

    default:
      safeNavigate(() => navigate('알림화면'));
  }
}

export async function requestNotificationPermission() {
  if (Platform.OS === 'android') {
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

export async function getFcmTokenAndSend() {
  try {
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

export function handleNotificationListeners() {
  if (listenersAttached) return () => {};
  listenersAttached = true;

  // ✅ 앱 시작 시: bell(종)만 동기화
  syncBellUnreadFromServer();

  const appStateSub = AppState.addEventListener('change', nextState => {
    if (nextState === 'active') {
      // ✅ 포그라운드 복귀 시에도 bell만 동기화
      syncBellUnreadFromServer();
    }
  });

  // 앱 열려있는 상태(포그라운드)에서 푸시 수신
  const unsubOnMessage = messaging().onMessage(async m => {
    const n = normalizeRemoteMessage(m);

    // ✅ 채팅 푸시로는 bell 동기화 절대 금지
    if (isBellType(n.notificationType)) {
      await syncBellUnreadFromServer();
    }

    const title = m.notification?.title ?? m.data?.title ?? '알림';
    const body =
      m.notification?.body ?? m.data?.body ?? '새로운 알림이 도착했어요';
    showToast(`${title}: ${body}`);
  });

  // 알림 클릭 -> 앱 열림(백그라운드 -> 포그라운드)
  const unsubOpened = messaging().onNotificationOpenedApp(async remoteMessage => {
    const n = normalizeRemoteMessage(remoteMessage);

    // ✅ POST/COMMENT 계열만 bell 동기화 (채팅은 제외)
    if (isBellType(n.notificationType)) {
      await syncBellUnreadFromServer();
    }

    openFromRemoteMessage(remoteMessage);
  });

  // 앱 종료 상태에서 알림 클릭
  messaging()
    .getInitialNotification()
    .then(async remoteMessage => {
      if (remoteMessage) {
        const n = normalizeRemoteMessage(remoteMessage);

        // ✅ POST/COMMENT 계열만 bell 동기화 (채팅은 제외)
        if (isBellType(n.notificationType)) {
          await syncBellUnreadFromServer();
        }

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
    listenersAttached = false;
  };
}

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
