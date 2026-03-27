// src/features/chat/store/chatReadThunk.js
// 읽음 처리 관련 async thunk (chatRoomSlice와 분리하여 순환 의존 방지)
import {createAsyncThunk} from '@reduxjs/toolkit';
import {apiClient} from 'utils/apiClient';
import {getToken} from 'utils/storage';
import {toId} from './chatStoreUtils';

const API_BASE = '/chatRoom';

/**
 * markReadThunk
 * - 서버에 lastReadAt 저장 (POST /{chatRoomId}/read)
 * - 성공 시: (1) 내 포인터 저장 (2) 목록 unreadCount 0
 *
 * userId가 화면에서 undefined로 올 수 있어서:
 * - userId가 없으면 slice에서 포인터 저장은 스킵(에러 X)
 * - 그래도 unreadCount 0 / 서버 저장은 정상
 */
export const markReadThunk = createAsyncThunk(
  'chatRoom/markRead',
  async ({chatRoomId, lastReadAt, userId}, {rejectWithValue}) => {
    try {
      const token = await getToken();
      const rid = toId(chatRoomId);
      if (!rid) return rejectWithValue('chatRoomId가 없습니다.');

      // lastReadAt이 Date/ISO 등으로 들어오면, 최종적으로 "Z 없는 LocalDateTime"으로 맞춰서 보냄
      const normalized =
        typeof lastReadAt === 'string'
          ? lastReadAt
          : (() => {
              const d =
                lastReadAt instanceof Date ? lastReadAt : new Date(lastReadAt);
              if (Number.isNaN(d.getTime())) return null;
              const pad2 = n => String(n).padStart(2, '0');
              const pad3 = n => String(n).padStart(3, '0');
              return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(
                d.getDate(),
              )}T${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(
                d.getSeconds(),
              )}.${pad3(d.getMilliseconds())}`;
            })();

      if (!normalized) return rejectWithValue('lastReadAt이 올바르지 않습니다.');

      const body = {lastReadAt: normalized};

      await apiClient.post(`${API_BASE}/${rid}/read`, body, {
        headers: {Authorization: `Bearer ${token}`},
      });

      return {
        chatRoomId: rid,
        userId: userId == null ? null : String(userId),
        lastReadAt: body.lastReadAt,
      };
    } catch (err) {
      const msg = err?.response?.data || err?.message || '알 수 없는 오류';
      return rejectWithValue(msg);
    }
  },
);

/**
 * fetchReadPointersThunk
 * - 채팅방 참여자별 포인터 조회 (GET /{chatRoomId}/readPointers)
 */
export const fetchReadPointersThunk = createAsyncThunk(
  'chatRoom/fetchReadPointers',
  async ({chatRoomId}, {rejectWithValue}) => {
    try {
      const token = await getToken();
      const rid = toId(chatRoomId);
      if (!rid) return rejectWithValue('chatRoomId가 없습니다.');

      const res = await apiClient.get(`${API_BASE}/${rid}/readPointers`, {
        headers: {Authorization: `Bearer ${token}`},
      });

      const data = res.data || {};
      const pointers =
        data.pointers ||
        data.readPointers ||
        data.items ||
        (Array.isArray(data) ? data : []);

      return {chatRoomId: rid, pointers: Array.isArray(pointers) ? pointers : []};
    } catch (err) {
      const msg = err?.response?.data || err?.message || '알 수 없는 오류';
      return rejectWithValue(msg);
    }
  },
);
