// src/features/notification/requestNotificationPermission.js
import store from 'store';
import {
  PermissionsAndroid,
  Platform,
  AppState,
  InteractionManager,
} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { apiClient } from 'utils/apiClient';
import {getToken as getJWT} from 'utils/storage';
import {navigate, navigationRef} from 'app/navigation/navigationRef';
import {CommonActions} from '@react-navigation/native';

import {
  fetchUnreadCountThunk,
  fetchHasUnreadThunk,
} from '../store/notificationThunk';

import {applyAppBadgeCount} from 'utils/appBadge';

import notifee, {AndroidStyle, EventType} from '@notifee/react-native';

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
    const res = await apiClient.get(`${CHATROOM_BASE}/${chatRoomId}`, {
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

const safeJsonParse = (v, fallback) => {
  try {
    if (typeof v !== 'string') return fallback;
    return JSON.parse(v);
  } catch {
    return fallback;
  }
};

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

    unreadCount: toStr(data.unreadCount),
    badgeCount: toStr(data.badgeCount),

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

async function ensureAndroidChannel(channelId) {
  if (Platform.OS !== 'android') return channelId;

  return await notifee.createChannel({
    id: channelId,
    name:
      channelId === 'chat'
        ? 'Chat'
        : channelId === 'post'
        ? 'Post'
        : channelId === 'comment'
        ? 'Comment'
        : 'Default',
  });
}

/**
 * ✅ [핵심] iOS NSE(A안) 쓰는 경우 중복 방지 규칙
 * - iOS: 시스템 알림(Extension이 이미지 붙임)을 쓰므로 Notifee 로컬 알림은 "채팅/멘션채팅"에선 띄우지 않기
 * - Android: Notifee로 계속 렌더링(카톡 스타일)
 */
function shouldBlockNotifeeOnThisPlatform(type) {
  if (Platform.OS !== 'ios') return false;

  // ✅ iOS(A안): 채팅은 NSE + 시스템 알림이 떠야 한다.
  // notifee까지 띄우면 중복 2개 뜸.
  if (isChatType(type)) return true;

  return false;
}

/**
 * ✅ 서버 기준 "종(bell)" 뱃지/빨간점만 동기화
 * - ⚠️ 채팅 푸시(CHAT / MENTION_CHAT)로는 절대 호출하면 안 됨
 *
 * ✅ (개선) 과호출 방지(throttle)
 */
let lastBellSyncAt = 0;
const BELL_SYNC_THROTTLE_MS = 5000;

async function syncBellUnreadFromServer(force = false) {
  try {
    const now = Date.now();
    if (!force && now - lastBellSyncAt < BELL_SYNC_THROTTLE_MS) return;
    lastBellSyncAt = now;

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
 * ✅ (개선) openFromRemoteMessage 중복 방지 가드
 * - 시스템알림 + notifee + 초기열기 등이 겹칠 때 라우팅 2번 타는 걸 막음
 */
let lastOpenSig = null;
let lastOpenAt = 0;
const OPEN_GUARD_MS = 900;

function buildOpenSig(remoteMessage) {
  const d = remoteMessage?.data || {};
  const type = (d.pushType || d.notificationType || d.type || '').toString();
  const postId = (d.postId || '').toString();
  const commentId = (d.commentId || '').toString();
  const chatRoomId = (d.chatRoomId || '').toString();
  const scheduleId = (d.scheduleId || '').toString();

  // ✅ 가장 흔한 식별 조합
  return `${type}|${postId}|${commentId}|${chatRoomId}|${scheduleId}`;
}

function shouldBlockDuplicateOpen(remoteMessage) {
  const now = Date.now();
  const sig = buildOpenSig(remoteMessage);

  if (lastOpenSig === sig && now - lastOpenAt < OPEN_GUARD_MS) {
    return true;
  }
  lastOpenSig = sig;
  lastOpenAt = now;
  return false;
}

/**
 * ✅ data-only + 카톡스타일 Notifee 표시
 * - Android: largeIcon = senderImage
 * - 이미지 채팅이면 BIGPICTURE = imageUrls[0]
 * - 게시글/댓글이면 BIGPICTURE = firstImageUrl
 *
 * ⚠️ smallIcon은 반드시 안드 리소스에 존재해야 함:
 *   android/app/src/main/res/drawable/ic_stat_notification.png
 */
async function displayNotifeeFromRemoteMessage(remoteMessage) {
  const n = normalizeRemoteMessage(remoteMessage);
  const data = remoteMessage?.data || {};
  const type = n.notificationType || 'DEFAULT';

  // ✅ iOS(A안) 중복 방지
  if (shouldBlockNotifeeOnThisPlatform(type)) return;

  const title =
    data?.title ||
    data?.roomName ||
    data?.categoryTitle ||
    remoteMessage?.notification?.title ||
    '알림';

  const body =
    data?.body || remoteMessage?.notification?.body || '새 소식이 있어요';

  // ✅ badgeCount가 있으면 먼저 반영
  await applyBadgeFromPush(n);

  const cid = pickAndroidChannelId(type);
  const channelId = await ensureAndroidChannel(cid);

  const senderImage = data?.senderImage || null;
  const firstImageUrl = data?.firstImageUrl || null;
  const messageType = String(data?.messageType || '').toLowerCase();
  const imageUrls = safeJsonParse(data?.imageUrls, []);

  // ✅ BIGPICTURE 대상
  let bigPictureUrl = null;

  if (isChatType(type) && messageType === 'image') {
    bigPictureUrl = imageUrls?.[0] || firstImageUrl || null;
  } else if (isBellType(type)) {
    bigPictureUrl = firstImageUrl || null;
  }

  const android =
    Platform.OS === 'android'
      ? {
          channelId,
          pressAction: {id: 'default'},
          smallIcon: 'ic_stat_notification',
          largeIcon: senderImage || undefined,
          ...(bigPictureUrl
            ? {
                style: {
                  type: AndroidStyle.BIGPICTURE,
                  picture: bigPictureUrl,
                  largeIcon: senderImage || undefined,
                },
              }
            : {}),
        }
      : undefined;

  await notifee.displayNotification({
    title: String(title),
    body: String(body),

    // ✅ 눌렀을 때 라우팅에 필요한 data 유지
    data: {
      ...data,

      notificationType: n.notificationType,
      pushType: n.pushType,

      postId: n.postId,
      commentId: n.commentId,
      chatRoomId: n.chatRoomId,
      scheduleId: n.scheduleId,

      unreadCount: n.unreadCount,
      badgeCount: n.badgeCount,
      roomName: n.roomName,
    },

    android,
  });
}

async function openFromRemoteMessage(remoteMessage) {
  // ✅ (개선) 중복 open 방지
  if (shouldBlockDuplicateOpen(remoteMessage)) return;

  const n = normalizeRemoteMessage(remoteMessage);

  console.log('[PUSH OPENED data]', remoteMessage?.data);
  console.log('[PUSH normalized]', n);

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

      const chatRoom = await fetchChatRoomDetail(n.chatRoomId);

      if (!chatRoom) {
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
            params: {
              chatRoom,
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

    const res = await apiClient.post(
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

  // ✅ 첫 진입은 강제 1회
  syncBellUnreadFromServer(true);

  const appStateSub = AppState.addEventListener('change', nextState => {
    if (nextState === 'active') {
      // ✅ 과호출 방지(throttle)
      syncBellUnreadFromServer(false);
    }
  });

  // ✅ 포그라운드 수신
  const unsubOnMessage = messaging().onMessage(async m => {
    const n = normalizeRemoteMessage(m);

    await applyBadgeFromPush(n);

    if (isBellType(n.notificationType)) {
      // ✅ 과호출 방지(throttle)
      await syncBellUnreadFromServer(false);
    }

    // ✅ iOS(A안) 채팅 중복 방지 포함
    await displayNotifeeFromRemoteMessage(m);

    // ✅ 토스트는 포그라운드에서만
    const title = m.notification?.title ?? m.data?.title ?? '알림';
    const body =
      m.notification?.body ?? m.data?.body ?? '새로운 알림이 도착했어요';
    showToast(`${title}: ${body}`);
  });

  /**
   * ✅ data-only 중심이면
   * - 실제 클릭은 Notifee 로컬 알림에서 발생
   * - -> Notifee press 이벤트로 라우팅
   */

  // ✅ Notifee 클릭(포그라운드)
  const unsubNotifeeFg = notifee.onForegroundEvent(async ({type, detail}) => {
    if (type !== EventType.PRESS) return;

    const data = detail?.notification?.data || {};
    const fakeRemoteMessage = {data};

    const n = normalizeRemoteMessage(fakeRemoteMessage);

    await applyBadgeFromPush(n);

    if (isBellType(n.notificationType)) {
      await syncBellUnreadFromServer(false);
    }

    await openFromRemoteMessage(fakeRemoteMessage);
  });

  // ✅ 앱이 Notifee 알림 클릭으로 시작된 경우(완전 종료 -> 실행)
  notifee.getInitialNotification().then(async initial => {
    const data = initial?.notification?.data;
    if (!data) return;

    const fakeRemoteMessage = {data};
    const n = normalizeRemoteMessage(fakeRemoteMessage);

    await applyBadgeFromPush(n);

    if (isBellType(n.notificationType)) {
      await syncBellUnreadFromServer(false);
    }

    await openFromRemoteMessage(fakeRemoteMessage);
  });

  /**
   * ✅ (레거시/혼합 대응) notification payload로 올 수도 있으면 유지
   * - iOS에서 CHAT을 alert로 보내면 여기로 들어올 수 있음
   * - openFromRemoteMessage로 동일 라우팅 처리
   */
  const unsubOpened = messaging().onNotificationOpenedApp(async remoteMessage => {
    if (!remoteMessage) return;

    const n = normalizeRemoteMessage(remoteMessage);

    await applyBadgeFromPush(n);

    if (isBellType(n.notificationType)) {
      await syncBellUnreadFromServer(false);
    }

    await openFromRemoteMessage(remoteMessage);
  });

  messaging()
    .getInitialNotification()
    .then(async remoteMessage => {
      if (!remoteMessage) return;

      const n = normalizeRemoteMessage(remoteMessage);

      await applyBadgeFromPush(n);

      if (isBellType(n.notificationType)) {
        await syncBellUnreadFromServer(false);
      }

      await openFromRemoteMessage(remoteMessage);
    });

  const unsubTokenRefresh = messaging().onTokenRefresh(async token => {
    const accessToken = await getJWT();
    if (!accessToken) return;

    try {
      await apiClient.post(
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
      unsubNotifeeFg?.();
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

      await applyBadgeFromPush(n);

      // ✅ iOS(A안): BG에서 Notifee 호출할 이유가 없다(채팅은 시스템 알림)
      // ✅ Android: BG에서도 Notifee로 렌더링
      if (Platform.OS === 'android') {
        await displayNotifeeFromRemoteMessage(remoteMessage);
      }
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
