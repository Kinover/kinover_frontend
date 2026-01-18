// src/features/chat/store/chatRoomThunk.js

import {createAsyncThunk} from '@reduxjs/toolkit';
import {apiClient} from '../../../utils/apiClient';

import {
  setChatRoomList,
  setChatRoomUsers,
  setChatRoomLoading,
  setChatRoomError,
  setChatRoomNotificationState,
} from './chatRoomSlice';

import {markReadThunk} from './chatRoomSlice';
import {syncAppBadgeThunk} from '../../notification/store/notificationThunk'; // 경로 맞춰줘!

// ✅ apiClient baseURL = https://kinover.shop/api
// 그래서 여기서는 /chatRoom만 붙이면 됨
const API_BASE = '/chatRoom';

// ✅ 이 파일에서 toId를 쓰려면 여기서 선언해야 함 (slice에만 있던 헬퍼라서)
const toId = v => (v == null ? null : String(v));

/**
 * ✅ 채팅방 리스트 조회
 * POST /api/chatRoom/{familyId}/{userId}
 */
export const fetchChatRoomListThunk = (familyId, userId) => {
  return async dispatch => {
    dispatch(setChatRoomLoading(true));
    try {
      const apiUrl = `${API_BASE}/${familyId}/${userId}`;

      const response = await apiClient.post(apiUrl, {}, {
        headers: {'Content-Type': 'application/json'},
      });

      dispatch(setChatRoomList(response.data));
    } catch (error) {
      dispatch(setChatRoomError(error?.message || '채팅방 목록 조회 실패'));
    } finally {
      dispatch(setChatRoomLoading(false));
    }
  };
};

/**
 * ✅ 채팅방 유저 조회
 * POST /api/chatRoom/{chatRoomId}/users/get
 */
export const fetchChatRoomUsersThunk = chatRoomId => {
  return async dispatch => {
    dispatch(setChatRoomLoading(true));
    try {
      const apiUrl = `${API_BASE}/${chatRoomId}/users/get`;

      const response = await apiClient.post(apiUrl, {});

      dispatch(setChatRoomUsers(response.data));
    } catch (error) {
      dispatch(setChatRoomError(error?.message || '채팅방 유저 조회 실패'));
    } finally {
      dispatch(setChatRoomLoading(false));
    }
  };
};

/**
 * ✅ 채팅방 나가기
 * DELETE /api/chatRoom/{chatRoomId}/leave
 */
export const leaveChatRoomThunk = createAsyncThunk(
  'chatRoom/leaveChatRoom',
  async (chatRoomId, {rejectWithValue}) => {
    try {
      await apiClient.delete(`${API_BASE}/${chatRoomId}/leave`);
      return chatRoomId;
    } catch (error) {
      const msg = error?.response?.data || error?.message || '알 수 없는 에러';
      return rejectWithValue(msg);
    }
  },
);

/**
 * ✅ 채팅방 이름 변경
 * PATCH /api/chatRoom/{chatRoomId}/rename?roomName=...
 */
export const renameChatRoomThunk = createAsyncThunk(
  'chatRoom/renameChatRoom',
  async (
    {familyId, userId, chatRoomId, roomName},
    {rejectWithValue, dispatch},
  ) => {
    try {
      await apiClient.patch(`${API_BASE}/${chatRoomId}/rename`, null, {
        params: {roomName},
      });

      // ✅ 이름 바꾼 뒤 리스트 갱신
      dispatch(fetchChatRoomListThunk(familyId, userId));
      return true;
    } catch (err) {
      const msg = err?.response?.data || err?.message || '알 수 없는 오류';
      return rejectWithValue(msg);
    }
  },
);

/**
 * ✅ 채팅방 생성
 * POST /api/chatRoom/create/{roomName}/{userIds}/{familyId}
 */
export const createChatRoomThunk = createAsyncThunk(
  'chatRoom/create',
  async ({roomName, userIds, familyId}, {rejectWithValue}) => {
    try {
      const response = await apiClient.post(
        `${API_BASE}/create/${encodeURIComponent(roomName)}/${userIds}/${familyId}`,
        null,
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data || '채팅방 생성 실패');
    }
  },
);

/**
 * ✅ 키노 성격(페르소나) 변경
 * PATCH /api/chatRoom/{chatRoomId}/personality
 */
export const updateKinoPersonalityThunk = createAsyncThunk(
  'chatRoom/updatePersonality',
  async ({chatRoomId, personality}, {rejectWithValue}) => {
    try {
      const response = await apiClient.patch(
        `${API_BASE}/${chatRoomId}/personality`,
        {personality},
        {headers: {'Content-Type': 'application/json'}},
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data || err?.message || '알 수 없는 오류',
      );
    }
  },
);

/**
 * ✅ 채팅방 알림 ON/OFF
 * PATCH /api/chatRoom/notification/chatroom?userId=...&chatRoomId=...&isOn=...
 */
export const toggleChatRoomNotificationThunk = createAsyncThunk(
  'chatRoom/toggleNotification',
  async ({userId, chatRoomId, isOn}, {rejectWithValue, dispatch}) => {
    try {
      await apiClient.patch(`${API_BASE}/notification/chatroom`, null, {
        params: {userId, chatRoomId, isOn},
        headers: {'Content-Type': 'application/json'},
      });

      dispatch(setChatRoomNotificationState({chatRoomId, isOn}));
      return {chatRoomId, isOn};
    } catch (err) {
      const msg = err?.response?.data || err?.message || '알 수 없는 에러';
      return rejectWithValue(msg);
    }
  },
);

/**
 * ✅ 채팅방 미디어 모아보기
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

      const res = await apiClient.get(`${API_BASE}/${rid}/media`, {
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
      const msg = err?.response?.data || err?.message || '알 수 없는 오류';
      return rejectWithValue(msg);
    }
  },
);

/**
 * ✅ 전체 채팅방 알림 ON/OFF
 * PATCH /api/chatRoom/notification/user?userId=...&isOn=...
 */
export const toggleAllChatRoomNotificationThunk = createAsyncThunk(
  'chatRoom/toggleAllNotification',
  async ({userId, isOn}, {rejectWithValue}) => {
    try {
      const res = await apiClient.patch(`${API_BASE}/notification/user`, null, {
        params: {userId, isOn},
      });

      // 서버가 text를 주든 json을 주든 대응
      return {userId, isOn, result: res?.data ?? null};
    } catch (err) {
      const msg = err?.response?.data || err?.message || '알 수 없는 에러';
      return rejectWithValue(msg);
    }
  },
);

/* =========================
 * ✅ 채팅방 단건 조회 (푸시/딥링크 진입용) - GET으로 통일
 * GET /api/chatRoom/{chatRoomId}
 * ========================= */
export const fetchChatRoomThunk = createAsyncThunk(
  'chatRoom/fetchChatRoom',
  async (chatRoomId, {rejectWithValue}) => {
    try {
      const res = await apiClient.get(`${API_BASE}/${chatRoomId}`);
      return res?.data;
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        '채팅방 단건 조회 실패';

      return rejectWithValue(msg);
    }
  },
);

// ✅ 채팅 읽음 처리 후 앱 뱃지 동기화까지 같이
export const markReadAndSyncBadgeThunk =
  ({chatRoomId, lastReadAt, userId}) =>
  async dispatch => {
    await dispatch(markReadThunk({chatRoomId, lastReadAt, userId}));
    await dispatch(syncAppBadgeThunk());
  };
