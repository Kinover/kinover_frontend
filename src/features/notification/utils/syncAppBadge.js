import {applyAppBadgeCount} from 'utils/appBadge';
import {notificationApi} from '../services/notificationApi';
import {selectChatUnreadTotal} from 'features/chat/store/chatRoomSelector';

async function syncAppBadgeFallbackBellPlusChat({dispatch, getState}) {
  const req = dispatch(
    notificationApi.endpoints.getUnreadCount.initiate(undefined, {
      forceRefetch: true,
    }),
  );

  let notiCount = 0;
  try {
    const data = await req.unwrap();
    notiCount = Number(data?.unreadCount ?? 0) || 0;
  } finally {
    req.unsubscribe();
  }

  const state = typeof getState === 'function' ? getState() : {};
  const chatTotal = Number(selectChatUnreadTotal(state) ?? 0) || 0;
  const total = chatTotal + notiCount;

  await applyAppBadgeCount(total);
  return {total, chatTotal, notiCount, source: 'fallback'};
}

/**
 * 서버 GET /user/badge-count(종+채팅 합산)로 앱 아이콘 배지 동기화.
 * API 실패 시 기존처럼 벨 unread-count + 리덕스 채팅 unread 합으로 폴백.
 */
export async function syncAppBadge({dispatch, getState}) {
  const req = dispatch(
    notificationApi.endpoints.getBadgeCount.initiate(undefined, {
      forceRefetch: true,
    }),
  );

  try {
    const data = await req.unwrap();
    const total = Number(data?.badgeCount ?? 0) || 0;
    await applyAppBadgeCount(total);
    return {
      total,
      chatTotal: null,
      notiCount: null,
      source: 'badgeCountApi',
    };
  } catch {
    return syncAppBadgeFallbackBellPlusChat({dispatch, getState});
  } finally {
    req.unsubscribe();
  }
}
