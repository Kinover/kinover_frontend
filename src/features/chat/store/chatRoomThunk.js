// src/features/chat/store/chatRoomThunk.js
// RTK Query 마이그레이션 후 제거된 thunk 목록:
//   fetchChatRoomListThunk      → useGetChatRoomsQuery
//   fetchChatRoomUsersThunk     → useGetChatRoomUsersQuery
//   leaveChatRoomThunk          → useLeaveChatRoomMutation
//   renameChatRoomThunk         → useRenameChatRoomMutation
//   renameChatRoomForMeThunk    → useRenameChatRoomForMeMutation
//   createChatRoomThunk         → useCreateChatRoomMutation
//   addUsersToChatRoomThunk     → useAddUsersToChatRoomMutation
//   updateKinoPersonalityThunk  → useUpdateKinoPersonalityMutation
//   toggleChatRoomNotificationThunk     → useToggleChatRoomNotificationMutation
//   toggleAllChatRoomNotificationThunk  → useToggleAllChatRoomNotificationMutation
//   fetchChatRoomMediaThunk     → useGetChatRoomMediaQuery
//   fetchChatRoomThunk          → useGetChatRoomQuery
//
// import 경로: features/chat/services/chatApi

import {markReadThunk} from './chatReadThunk';
import {syncAppBadge} from 'features/notification/utils/syncAppBadge';

/**
 * 채팅 읽음 처리 후 앱 뱃지 동기화
 * markReadThunk (REST+WS) + syncAppBadgeThunk 를 순서대로 dispatch
 */
export const markReadAndSyncBadgeThunk =
  ({chatRoomId, lastReadAt, userId}) =>
  async (dispatch, getState) => {
    await dispatch(markReadThunk({chatRoomId, lastReadAt, userId}));
    await syncAppBadge({dispatch, getState});
  };
