// src/features/chat/store/chatRoomThunk.js
import axios from 'axios';
import {createAsyncThunk} from '@reduxjs/toolkit';
import {getToken} from '../../../utils/storage';

import {
  setChatRoomList,
  setChatRoomUsers,
  setChatRoomLoading,
  setChatRoomError,
  setChatRoomNotificationState,
} from './chatRoomSlice';

import {markReadThunk} from './chatRoomSlice';
import {syncAppBadgeThunk} from '../../notification/store/notificationThunk'; // 경로 맞춰줘!

const API_BASE = 'https://kinover.shop/api/chatRoom';

// ✅ 이 파일에서 toId를 쓰려면 여기서 선언해야 함 (slice에만 있던 헬퍼라서)
const toId = v => (v == null ? null : String(v));

export const fetchChatRoomListThunk = (familyId, userId) => {
  return async dispatch => {
    dispatch(setChatRoomLoading(true));
    try {
      const apiUrl = `${API_BASE}/${familyId}/${userId}`;
      const token = await getToken();

      const response = await axios.post(
        apiUrl,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      dispatch(setChatRoomList(response.data));
    } catch (error) {
      dispatch(setChatRoomError(error?.message || '채팅방 목록 조회 실패'));
    } finally {
      dispatch(setChatRoomLoading(false));
    }
  };
};

export const fetchChatRoomUsersThunk = chatRoomId => {
  return async dispatch => {
    dispatch(setChatRoomLoading(true));
    try {
      const token = await getToken();
      const apiUrl = `${API_BASE}/${chatRoomId}/users/get`;

      const response = await axios.post(
        apiUrl,
        {},
        {headers: {Authorization: `Bearer ${token}`}},
      );

      dispatch(setChatRoomUsers(response.data));
    } catch (error) {
      dispatch(setChatRoomError(error?.message || '채팅방 유저 조회 실패'));
    } finally {
      dispatch(setChatRoomLoading(false));
    }
  };
};

export const leaveChatRoomThunk = createAsyncThunk(
  'chatRoom/leaveChatRoom',
  async (chatRoomId, {rejectWithValue}) => {
    try {
      const token = await getToken();

      const res = await fetch(`${API_BASE}/${chatRoomId}/leave`, {
        method: 'DELETE',
        headers: {Authorization: `Bearer ${token}`},
      });

      if (!res.ok) {
        return rejectWithValue(`서버 오류: ${res.status}`);
      }

      return chatRoomId;
    } catch (error) {
      return rejectWithValue(error?.message || '알 수 없는 에러');
    }
  },
);

export const renameChatRoomThunk = createAsyncThunk(
  'chatRoom/renameChatRoom',
  async (
    {familyId, userId, chatRoomId, roomName},
    {rejectWithValue, dispatch},
  ) => {
    try {
      const token = await getToken();
      const response = await fetch(
        `${API_BASE}/${chatRoomId}/rename?roomName=${encodeURIComponent(
          roomName,
        )}`,
        {
          method: 'PATCH',
          headers: {Authorization: `Bearer ${token}`},
        },
      );

      if (!response.ok) {
        return rejectWithValue(`이름 변경 실패: ${response.status}`);
      }

      await response.text().catch(() => '');
      dispatch(fetchChatRoomListThunk(familyId, userId));
      return true;
    } catch (err) {
      return rejectWithValue(err?.message || '알 수 없는 오류');
    }
  },
);

export const createChatRoomThunk = createAsyncThunk(
  'chatRoom/create',
  async ({roomName, userIds, familyId}, {rejectWithValue}) => {
    try {
      const token = await getToken();
      const response = await axios.post(
        `${API_BASE}/create/${encodeURIComponent(roomName)}/${userIds}/${familyId}`,
        null,
        {headers: {Authorization: `Bearer ${token}`}},
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data || '채팅방 생성 실패');
    }
  },
);

export const updateKinoPersonalityThunk = createAsyncThunk(
  'chatRoom/updatePersonality',
  async ({chatRoomId, personality}, {rejectWithValue}) => {
    try {
      const token = await getToken();
      const response = await axios.patch(
        `${API_BASE}/${chatRoomId}/personality`,
        {personality},
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data || err?.message || '알 수 없는 오류',
      );
    }
  },
);

export const toggleChatRoomNotificationThunk = createAsyncThunk(
  'chatRoom/toggleNotification',
  async ({userId, chatRoomId, isOn}, {rejectWithValue, dispatch}) => {
    try {
      const token = await getToken();

      const url = `${API_BASE}/notification/chatroom?userId=${userId}&chatRoomId=${chatRoomId}&isOn=${isOn}`;

      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        return rejectWithValue(`알림 설정 실패: ${res.status}`);
      }

      dispatch(setChatRoomNotificationState({chatRoomId, isOn}));
      return {chatRoomId, isOn};
    } catch (err) {
      return rejectWithValue(err?.message || '알 수 없는 에러');
    }
  },
);

/**
 * ✅ 채팅방 미디어 모아보기
 * GET /api/chatRoom/{chatRoomId}/media?type=ALL|IMAGE|VIDEO&before=...&limit=...
 *
 * ✅ RN + ESLint no-undef 문제 회피:
 * - URLSearchParams 대신 axios의 params 옵션 사용 (가장 안정적)
 */
export const fetchChatRoomMediaThunk = createAsyncThunk(
  'chatRoom/fetchChatRoomMedia',
  async (
    {chatRoomId, type = 'ALL', before = null, limit = 30},
    {rejectWithValue},
  ) => {
    try {
      const token = await getToken();
      const rid = toId(chatRoomId);
      if (!rid) return rejectWithValue('chatRoomId가 없습니다.');

      const res = await axios.get(`${API_BASE}/${rid}/media`, {
        headers: {Authorization: `Bearer ${token}`},
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

export const toggleAllChatRoomNotificationThunk = createAsyncThunk(
  'chatRoom/toggleAllNotification',
  async ({userId, isOn}, {rejectWithValue}) => {
    try {
      const token = await getToken();
      const url = `${API_BASE}/notification/user?userId=${userId}&isOn=${isOn}`;

      const res = await fetch(url, {
        method: 'PATCH',
        headers: {Authorization: `Bearer ${token}`},
      });

      if (!res.ok) {
        return rejectWithValue(`전체 채팅방 알림 설정 실패: ${res.status}`);
      }

      const result = await res.text();
      return {userId, isOn, result};
    } catch (err) {
      return rejectWithValue(err?.message || '알 수 없는 에러');
    }
  },
);

/* =========================
 * ✅ 채팅방 단건 조회 (푸시/딥링크 진입용) - GET으로 통일
 * ========================= */
export const fetchChatRoomThunk = createAsyncThunk(
  'chatRoom/fetchChatRoom',
  async (chatRoomId, {rejectWithValue}) => {
    try {
      const token = await getToken();
      if (!token) return rejectWithValue('토큰이 없습니다.');

      const res = await axios.get(`${API_BASE}/${chatRoomId}`, {
        headers: {Authorization: `Bearer ${token}`},
      });

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
