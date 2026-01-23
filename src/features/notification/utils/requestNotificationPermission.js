// src/features/notification/requestNotificationPermission.js
import store from 'store';
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

// ✅ 앱 아이콘 뱃지 적용(ios/android)
import {applyAppBadgeCount} from '../../../utils/appBadge';

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

// ✅ ChatRoom 단건조회 API
const CHATROOM_BASE = `${BASE}/chatRoom`;

async function fetchChatRoomDetail(chatRoomId) {
  if (!chatRoomId) return null;

  const accessToken = await getJWT();
  if (!accessToken) return null;

  try {
    const res = await axios.get(`${CHATROOM_BASE}/${chatRoomId}`, {
      headers: {Authorization: `Bearer ${accessToken}`},
    });
    return res?.data ?? null;
  } catch (e) {
    console.log('❌ chatRoom 단건조회 실패:', e?.response || e);
    return null;
  }
}

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
 * ✅ badgeCount가 내려오면 앱 아이콘 뱃지 즉시 반영
 * - CHAT/MENTION_CHAT 포함 모든 타입에서 사용 가능
 * - badgeCount는 서버가 "채팅+벨 합산"으로 내려주는 값
 */
async function applyBadgeFromPush(n) {
  try {
    const raw = n?.badgeCount;
    const num = Number(raw);
    if (!Number.isFinite(num) || num < 0) return;
    await applyAppBadgeCount(num);
  } catch {
    null;
  }
}

/**
 * ✅ 푸시 타입 정규화
 * - ✅ pushType 우선
 * - fallback: notificationType -> type
 */
function normalizeRemoteMessage(remoteMessage) {
  const data = remoteMessage?.data || {};

  const rawType = data.pushType || data.notificationType || data.type;
  const notificationType = rawType ? String(rawType).toUpperCase() : null;

  return {
    notificationType,
    pushType: data.pushType ? String(data.pushType).toUpperCase() : null,

    postId: toStr(data.postId),
    commentId: toStr(data.commentId),
    chatRoomId: toStr(data.chatRoomId),
    scheduleId: toStr(data.scheduleId),

    // 서버가 보내는 카운트(있으면 활용 가능)
    unreadCount: toStr(data.unreadCount), // ✅ bell 전용 count(레거시 호환)
    badgeCount: toStr(data.badgeCount),   // ✅ 앱 아이콘 뱃지(채팅+벨 합)

    // 일부 서버가 roomName을 data로도 줄 수 있어서 대비
    roomName: toStr(data.roomName),
  };
}

function isChatType(type) {
  return type === 'CHAT' || type === 'MENTION_CHAT';
}

function isBellType(type) {
  return type === 'POST' || type === 'COMMENT' || type === 'MENTION_COMMENT';
}

/**
 * ✅ pushType 기반으로 안드 BG 채널 선택
 */
function pickAndroidChannelId(type) {
  if (type === 'CHAT' || type === 'MENTION_CHAT') return 'chat';
  if (type === 'POST') return 'post';
  if (type === 'COMMENT' || type === 'MENTION_COMMENT') return 'comment';
  return 'default';
}

async function openFromRemoteMessage(remoteMessage) {
  const n = normalizeRemoteMessage(remoteMessage);

  console.log('[PUSH OPENED data]', remoteMessage?.data);
  console.log('[PUSH normalized]', n);

  // ✅ 어떤 타입이든 badgeCount가 있으면 아이콘 뱃지부터 즉시 반영
  await applyBadgeFromPush(n);

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
        safeNavigate(() => dispatchTabsNavigate({screen: '소통'}));
        return;
      }

      // ✅ FamilyChatRoom이 chatRoom 객체를 필요로 하니까 단건조회로 채워서 진입
      const chatRoom = await fetchChatRoomDetail(n.chatRoomId);

      // 단건조회 실패하면, 그래도 소통 탭으로는 보내주기
      if (!chatRoom) {
        safeNavigate(() =>
          dispatchTabsNavigate({
            screen: '소통',
          }),
        );
        return;
      }

      // route.params 포맷을 FamilyChatRoom.jsx가 기대하는 형태로 맞춤
      safeNavigate(() =>
        dispatchTabsNavigate({
          screen: '소통',
          params: {
            screen: '채팅방화면',
            params: {
              chatRoom, // ✅ 이게 중요!
              title: chatRoom?.roomName || n.roomName || '',
              userId: undefined,
              isKino: false,
            },
          },
        }),
      );
      return;
    }

    case 'SCHEDULE': {
      safeNavigate(() => dispatchTabsNavigate({screen: '일정'}));
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

  // ✅ 앱 열려있는 상태(포그라운드)에서 푸시 수신
  const unsubOnMessage = messaging().onMessage(async m => {
    const n = normalizeRemoteMessage(m);

    // ✅ badgeCount가 있으면 아이콘 뱃지 즉시 반영(채팅 포함)
    await applyBadgeFromPush(n);

    // ✅ bell 타입만 서버 기준 bell 동기화(채팅 푸시는 금지)
    if (isBellType(n.notificationType)) {
      await syncBellUnreadFromServer();
    }

    const title = m.notification?.title ?? m.data?.title ?? '알림';
    const body =
      m.notification?.body ?? m.data?.body ?? '새로운 알림이 도착했어요';
    showToast(`${title}: ${body}`);
  });

  // ✅ 알림 클릭 -> 앱 열림(백그라운드 -> 포그라운드)
  const unsubOpened = messaging().onNotificationOpenedApp(async remoteMessage => {
    const n = normalizeRemoteMessage(remoteMessage);

    // ✅ badgeCount가 있으면 아이콘 뱃지 즉시 반영
    await applyBadgeFromPush(n);

    // ✅ POST/COMMENT 계열만 bell 동기화 (채팅은 제외)
    if (isBellType(n.notificationType)) {
      await syncBellUnreadFromServer();
    }

    await openFromRemoteMessage(remoteMessage);
  });

  // ✅ 앱 종료 상태에서 알림 클릭
  messaging()
    .getInitialNotification()
    .then(async remoteMessage => {
      if (remoteMessage) {
        const n = normalizeRemoteMessage(remoteMessage);

        // ✅ badgeCount가 있으면 아이콘 뱃지 즉시 반영
        await applyBadgeFromPush(n);

        // ✅ POST/COMMENT 계열만 bell 동기화 (채팅은 제외)
        if (isBellType(n.notificationType)) {
          await syncBellUnreadFromServer();
        }

        await openFromRemoteMessage(remoteMessage);
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

      const n = normalizeRemoteMessage(remoteMessage);

      // ✅ (가능하면) BG에서도 badgeCount 반영 시도
      await applyBadgeFromPush(n);

      const notifee = (await import('@notifee/react-native')).default;

      let channelId;
      if (Platform.OS === 'android') {
        const cid = pickAndroidChannelId(n.notificationType);

        // ✅ 채널 미리 생성(없으면 생성)
        channelId = await notifee.createChannel({
          id: cid,
          name:
            cid === 'chat'
              ? 'Chat'
              : cid === 'post'
              ? 'Post'
              : cid === 'comment'
              ? 'Comment'
              : 'Default',
        });
      }

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
