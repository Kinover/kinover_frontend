// src/features/chat/store/chatRoomThunk.js
import {createAsyncThunk} from '@reduxjs/toolkit';
import {apiClient} from 'utils/apiClient';
import {getApiErrorMessage} from '../utils/apiErrorHandler';
import {CHAT_ROOM} from 'config/apiEndpoints';

import {
  setChatRoomList,
  setChatRoomUsers,
  setChatRoomLoading,
  setChatRoomError,
  setChatRoomNotificationState,
  markReadThunk,
} from './chatRoomSlice';
import {STORE_MOCK_ENABLED, getStoreMockChatRoomList, getStoreMockChatRoomUsers, isStoreMockChatRoomId} from '../../home/utils/storeMockData';
import {syncAppBadgeThunk} from 'features/notification/store/notificationThunk';

const toId = v => (v == null ? null : String(v));

/**
 * 채팅방 리스트 조회
 * POST /api/chatRoom/{familyId}/{userId}
 */
export const fetchChatRoomListThunk = (familyId, userId) => {
  return async dispatch => {
    dispatch(setChatRoomLoading(true));
    try {
      if (STORE_MOCK_ENABLED) {
        dispatch(setChatRoomList(getStoreMockChatRoomList()));
        return;
      }
      const apiUrl = CHAT_ROOM.list(familyId, userId);
      const response = await apiClient.post(
        apiUrl,
        {},
        {headers: {'Content-Type': 'application/json'}},
      );
      dispatch(setChatRoomList(response.data));
    } catch (error) {
      dispatch(setChatRoomError(getApiErrorMessage(error) || '채팅방 목록 조회 실패'));
    } finally {
      dispatch(setChatRoomLoading(false));
    }
  };
};

/**
 * 채팅방 유저 조회
 * POST /api/chatRoom/{chatRoomId}/users/get
 */
export const fetchChatRoomUsersThunk = chatRoomId => {
  return async dispatch => {
    dispatch(setChatRoomLoading(true));
    try {
      if (STORE_MOCK_ENABLED && isStoreMockChatRoomId(chatRoomId)) {
        dispatch(setChatRoomUsers(getStoreMockChatRoomUsers(chatRoomId)));
      } else {
        const apiUrl = CHAT_ROOM.usersGet(chatRoomId);
        const response = await apiClient.post(apiUrl, {});
        dispatch(setChatRoomUsers(response.data));
      }
    } catch (error) {
      dispatch(setChatRoomError(getApiErrorMessage(error) || '채팅방 유저 조회 실패'));
    } finally {
      dispatch(setChatRoomLoading(false));
    }
  };
};

/**
 * 채팅방 나가기
 * DELETE /api/chatRoom/{chatRoomId}/leave
 */
export const leaveChatRoomThunk = createAsyncThunk(
  'chatRoom/leaveChatRoom',
  async (chatRoomId, {rejectWithValue}) => {
    try {
      await apiClient.delete(CHAT_ROOM.leave(chatRoomId));
      return chatRoomId;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error) || '알 수 없는 에러');
    }
  },
);

/**
 * 채팅방 이름 변경 (방 자체 이름: 전체 사용자에게 영향 가능)
 * PATCH /api/chatRoom/{chatRoomId}/rename?roomName=...
 */
export const renameChatRoomThunk = createAsyncThunk(
  'chatRoom/renameChatRoom',
  async (
    {familyId, userId, chatRoomId, roomName},
    {rejectWithValue, dispatch},
  ) => {
    try {
      await apiClient.patch(CHAT_ROOM.rename(chatRoomId), null, {
        params: {roomName},
      });

      dispatch(fetchChatRoomListThunk(familyId, userId));
      return true;
    } catch (err) {
      return rejectWithValue(getApiErrorMessage(err) || '알 수 없는 오류');
    }
  },
);

/**
 * 채팅방 이름 변경 (내 화면에서만)
 * PATCH /api/chatRoom/{chatRoomId}/rename/me
 * body: { roomName: "..." }
 */
export const renameChatRoomForMeThunk = createAsyncThunk(
  'chatRoom/renameChatRoomForMe',
  async ({chatRoomId, roomName}, {rejectWithValue}) => {
    try {
      const rid = toId(chatRoomId);
      if (!rid) return rejectWithValue('chatRoomId가 없습니다.');

      const nextName = String(roomName ?? '').trim();
      if (!nextName) return rejectWithValue('roomName이 비어있습니다.');

      await apiClient.patch(
        CHAT_ROOM.renameMe(rid),
        {roomName: nextName},
        {headers: {'Content-Type': 'application/json'}},
      );

      return {chatRoomId: rid, roomName: nextName};
    } catch (err) {
      return rejectWithValue(getApiErrorMessage(err) || '알 수 없는 오류');
    }
  },
);

/**
 * 채팅방 생성 (권장: JSON)
 * POST /api/chatRoom/create
 * body: { familyId, roomName, userIds }
 */
export const createChatRoomThunk = createAsyncThunk(
  'chatRoom/create',
  async ({roomName, userIds, familyId}, {rejectWithValue}) => {
    try {
      const fid = familyId;
      if (!fid) return rejectWithValue('familyId가 없습니다.');

 // roomName: 비면 기본값으로 보정
      let trimmedName = String(roomName ?? '').trim();
      if (!trimmedName) trimmedName = '새 채팅방';

      let ids = [];
      if (Array.isArray(userIds)) {
        ids = userIds
          .map(v => (typeof v === 'object' ? v?.id : v))
          .filter(v => v != null)
          .map(v => Number(v))
          .filter(n => Number.isFinite(n));
      } else if (typeof userIds === 'string') {
        ids = userIds
          .split(',')
          .map(s => Number(String(s).trim()))
          .filter(n => Number.isFinite(n));
      }

      const res = await apiClient.post(
        CHAT_ROOM.create(),
        {
          familyId: fid,
          roomName: trimmedName,
          userIds: ids,
        },
        {headers: {'Content-Type': 'application/json'}},
      );

      return res.data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error) || '채팅방 생성 실패');
    }
  },
);

/**
 * 채팅방에 유저 추가(초대)
 * POST /api/chatRoom/{chatRoomId}/addUsers/{userIds}
 * userIds: "1,2,3"
 */
export const addUsersToChatRoomThunk = createAsyncThunk(
  'chatRoom/addUsersToChatRoom',
  async ({chatRoomId, userIds}, {rejectWithValue}) => {
    try {
      const rid = toId(chatRoomId);
      if (!rid) return rejectWithValue('chatRoomId가 없습니다.');

 // userIds 정규화: 배열이면 join, 객체 배열이면 id 뽑기
      let ids = [];
      if (Array.isArray(userIds)) {
        ids = userIds
          .map(v => (typeof v === 'object' ? v?.id : v))
          .filter(v => v != null)
          .map(v => String(v).trim())
          .filter(s => s.length > 0);
      } else {
        ids = String(userIds ?? '')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
      }

      if (ids.length === 0) return rejectWithValue('초대할 유저가 없습니다.');

      const idPath = ids.join(',');
      const res = await apiClient.post(
        CHAT_ROOM.addUsers(rid, idPath),
        null,
      );

      return res.data; // ChatRoomDTO
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error) || '유저 초대 실패');
    }
  },
);

/**
 * 키노 성격(페르소나) 변경
 * PATCH /api/chatRoom/{chatRoomId}/personality
 */
export const updateKinoPersonalityThunk = createAsyncThunk(
  'chatRoom/updatePersonality',
  async ({chatRoomId, personality}, {rejectWithValue}) => {
    try {
      const response = await apiClient.patch(
        CHAT_ROOM.personality(chatRoomId),
        {personality},
        {headers: {'Content-Type': 'application/json'}},
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(getApiErrorMessage(err) || '알 수 없는 오류');
    }
  },
);

/**
 * 채팅방 알림 ON/OFF
 * PATCH /api/chatRoom/notification/chatroom?userId=...&chatRoomId=...&isOn=...
 */
export const toggleChatRoomNotificationThunk = createAsyncThunk(
  'chatRoom/toggleNotification',
  async ({userId, chatRoomId, isOn}, {rejectWithValue, dispatch}) => {
    try {
      await apiClient.patch(CHAT_ROOM.notificationChatroom(), null, {
        params: {userId, chatRoomId, isOn},
        headers: {'Content-Type': 'application/json'},
      });

      dispatch(setChatRoomNotificationState({chatRoomId, isOn}));
      return {chatRoomId, isOn};
    } catch (err) {
      return rejectWithValue(getApiErrorMessage(err) || '알 수 없는 에러');
    }
  },
);

/**
 * 채팅방 미디어 모아보기
 * GET /api/chatRoom/{chatRoomId}/media?type=ALL|IMAGE|VIDEO&before=...&limit=...
 */
export const fetchChatRoomMediaThunk = createAsyncThunk(
  'chatRoom/fetchChatRoomMedia',
  async (
    {chatRoomId, type = 'ALL', before = null, limit = 30},
    {rejectWithValue},
  ) => {
    try {
      const rid = toId(chatRoomId);
      if (!rid) return rejectWithValue('chatRoomId가 없습니다.');

      const res = await apiClient.get(CHAT_ROOM.media(rid), {
        params: {
          type: String(type || 'ALL').toUpperCase(),
          limit: limit ?? 30,
          ...(before ? {before: String(before)} : {}),
        },
      });

      const data = res?.data || {};
      const items = Array.isArray(data.items) ? data.items : [];
      const nextBefore = data.nextBefore ?? null;

      return {
        chatRoomId: rid,
        type: String(type || 'ALL').toUpperCase(),
        items,
        nextBefore,
      };
    } catch (err) {
      return rejectWithValue(getApiErrorMessage(err) || '알 수 없는 오류');
    }
  },
);

/**
 * 전체 채팅방 알림 ON/OFF
 * PATCH /api/chatRoom/notification/user?userId=...&isOn=...
 */
export const toggleAllChatRoomNotificationThunk = createAsyncThunk(
  'chatRoom/toggleAllNotification',
  async ({userId, isOn}, {rejectWithValue}) => {
    try {
      const res = await apiClient.patch(CHAT_ROOM.notificationUser(), null, {
        params: {userId, isOn},
      });
      return {userId, isOn, result: res?.data ?? null};
    } catch (err) {
      return rejectWithValue(getApiErrorMessage(err) || '알 수 없는 에러');
    }
  },
);

/**
 * 채팅방 단건 조회 (푸시/딥링크 진입용)
 * GET /api/chatRoom/{chatRoomId}
 */
export const fetchChatRoomThunk = createAsyncThunk(
  'chatRoom/fetchChatRoom',
  async (chatRoomId, {rejectWithValue}) => {
    try {
      const res = await apiClient.get(CHAT_ROOM.one(chatRoomId));
      return res?.data;
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error) || '채팅방 단건 조회 실패');
    }
  },
);

// 채팅 읽음 처리 후 앱 뱃지 동기화까지 같이
export const markReadAndSyncBadgeThunk =
  ({chatRoomId, lastReadAt, userId}) =>
  async dispatch => {
    await dispatch(markReadThunk({chatRoomId, lastReadAt, userId}));
    await dispatch(syncAppBadgeThunk());
  };
