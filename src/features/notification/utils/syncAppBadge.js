import {applyAppBadgeCount} from 'utils/appBadge';
import {notificationApi} from '../services/notificationApi';
import {selectChatUnreadTotal} from 'features/chat/store/chatRoomSelector';

export async function syncAppBadge({dispatch, getState}) {
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
  return {total, chatTotal, notiCount};
}
