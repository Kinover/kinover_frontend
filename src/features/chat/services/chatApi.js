// src/features/chat/services/chatApi.js
// 채팅 기능 RTK Query API 엔드포인트
// baseApi.injectEndpoints()로 baseApi 확장
//
// 사용법:
//   import { useGetChatRoomsQuery, useCreateChatRoomMutation, ... } from 'features/chat/services/chatApi';

import {baseApi} from 'services/baseApi';
import {CHAT_ROOM} from 'config/apiEndpoints';
import {toId} from '../store/chatStoreUtils';
import {setChatRoomList, setReadPointers} from '../store/chatRoomSlice';
import {
  STORE_MOCK_ENABLED,
  getStoreMockChatRoomList,
  getStoreMockChatMessages,
  getStoreMockChatRoomUsers,
  isStoreMockChatRoomId,
} from '../../home/utils/storeMockData';
import {apiClient} from 'utils/apiClient';

/* =========================
 * 페이지네이션용 헬퍼
 * ========================= */
const appendDeduplicated = (currentCache, newItems) => {
  if (!Array.isArray(currentCache)) return newItems ?? [];
  const existingIds = new Set(
    currentCache
      .map(m => (m?.messageId != null ? String(m.messageId) : null))
      .filter(Boolean),
  );
  const onlyNew = (newItems ?? []).filter(
    m => m?.messageId != null && !existingIds.has(String(m.messageId)),
  );
  return sortMessagesDesc([...currentCache, ...onlyNew]);
};

const toMessageMs = v => {
  const s = String(v ?? '').trim().replace(' ', 'T');
  const t = new Date(s).getTime();
  return Number.isFinite(t) ? t : 0;
};

const messageSortKey = m =>
  String(m?.messageId ?? m?.clientMessageId ?? m?.createdAt ?? '');

const sortMessagesDesc = list => {
  const arr = Array.isArray(list) ? [...list] : [];
  arr.sort((a, b) => {
    const diff = toMessageMs(b?.createdAt) - toMessageMs(a?.createdAt);
    if (diff !== 0) return diff;
    return messageSortKey(b).localeCompare(messageSortKey(a));
  });
  return arr;
};

const getMessageArgRoomId = arg => {
  if (arg == null) return null;
  if (typeof arg === 'string' || typeof arg === 'number') return String(arg);
  return arg?.chatRoomId != null ? String(arg.chatRoomId) : null;
};

export const chatApi = baseApi.injectEndpoints({
  overrideExisting: false,
  endpoints: build => ({
    /* ──────────────────────────────────────
     * QUERIES
     * ────────────────────────────────────── */

    /**
     * 채팅방 목록 조회
     * POST /chatRoom/{familyId}/{userId}
     * onQueryFulfilled: slice에 setChatRoomList 동기화 (WS 핸들러가 slice를 직접 업데이트하므로)
     */
    getChatRooms: build.query({
      queryFn: async ({familyId, userId}) => {
        try {
          if (STORE_MOCK_ENABLED) {
            return {data: getStoreMockChatRoomList()};
          }
          const res = await apiClient.post(
            CHAT_ROOM.list(familyId, userId),
            {},
            {headers: {'Content-Type': 'application/json'}},
          );
          return {data: res.data ?? []};
        } catch (err) {
          return {
            error: {status: err?.response?.status, data: err?.message},
          };
        }
      },
      providesTags: ['ChatRoom'],
      async onQueryStarted(_arg, {dispatch, queryFulfilled}) {
        try {
          const {data} = await queryFulfilled;
          if (Array.isArray(data)) {
            dispatch(setChatRoomList(data));
          }
        } catch {
          // 에러 시 slice 업데이트 생략 (apiClient 인터셉터가 alert 처리)
        }
      },
    }),

    /**
     * 채팅방 유저 목록
     * POST /chatRoom/{chatRoomId}/users/get
     */
    getChatRoomUsers: build.query({
      queryFn: async chatRoomId => {
        try {
          const rid = toId(chatRoomId);
          if (!rid) return {data: []};
          if (STORE_MOCK_ENABLED && isStoreMockChatRoomId(rid)) {
            return {data: getStoreMockChatRoomUsers(rid)};
          }
          const res = await apiClient.post(CHAT_ROOM.usersGet(rid), {});
          return {data: res.data ?? []};
        } catch (err) {
          return {error: {status: err?.response?.status, data: err?.message}};
        }
      },
      providesTags: (result, error, chatRoomId) => [
        {type: 'ChatRoomUsers', id: String(chatRoomId)},
      ],
    }),

    /**
     * 메시지 목록 (최초 + 페이지네이션)
     * GET /chatRoom/{chatRoomId}/messages/fetch?limit=...&before=...
     *
     * RTK Query infinite scroll 패턴:
     * - serializeQueryArgs: chatRoomId만으로 캐시 키 → chatRoomId 당 캐시 1개
     * - merge: initial load면 교체, pagination이면 append+dedup
     * - forceRefetch: before 파라미터가 달라지면 재요청
     */
    getMessages: build.query({
      queryFn: async (arg, api, _extraOptions, baseQuery) => {
        const {chatRoomId, before = null, limit = 20} = arg || {};
        const rid = chatRoomId != null ? String(chatRoomId) : '';
        if (STORE_MOCK_ENABLED && isStoreMockChatRoomId(rid)) {
          const myId = api.getState()?.user?.userId ?? 'mock-first';
          let all = getStoreMockChatMessages(rid, myId);
          all = sortMessagesDesc(Array.isArray(all) ? [...all] : []);
          if (before) {
            const beforeMs = toMessageMs(before);
            all = all.filter(m => toMessageMs(m?.createdAt) < beforeMs);
          }
          return {data: all.slice(0, limit)};
        }
        return baseQuery({
          url: `/chatRoom/${chatRoomId}/messages/fetch`,
          params: {
            limit,
            ...(before ? {before: String(before)} : {}),
          },
        });
      },
      providesTags: (result, error, {chatRoomId}) => [
        {type: 'Messages', id: String(chatRoomId)},
      ],
      // 같은 chatRoomId면 하나의 캐시 슬롯 사용 (before가 달라도)
      serializeQueryArgs: ({queryArgs}) => getMessageArgRoomId(queryArgs),
      // 페이지네이션 결과 병합
      merge: (currentCache, newItems, {arg}) => {
        const incoming = sortMessagesDesc(newItems);
        if (!arg.before) {
          currentCache.splice(0, currentCache.length, ...incoming);
          return;
        }
        const merged = appendDeduplicated(currentCache, incoming);
        currentCache.splice(0, currentCache.length, ...merged);
      },
      // before가 다르거나 chatRoomId가 다를 때 재요청
      forceRefetch: ({currentArg, previousArg}) =>
        currentArg?.chatRoomId !== previousArg?.chatRoomId ||
        currentArg?.before !== previousArg?.before,
    }),

    /**
     * 읽음 포인터 조회
     * GET /chatRoom/{chatRoomId}/readPointers
     * onQueryFulfilled: chatRoomSlice에 setReadPointers 동기화
     */
    getReadPointers: build.query({
      query: chatRoomId => ({
        url: `/chatRoom/${chatRoomId}/readPointers`,
      }),
      providesTags: (result, error, chatRoomId) => [
        {type: 'ReadPointers', id: String(chatRoomId)},
      ],
      async onQueryStarted(chatRoomId, {dispatch, queryFulfilled}) {
        try {
          const {data} = await queryFulfilled;
          dispatch(
            setReadPointers({
              chatRoomId: String(chatRoomId),
              pointers: data?.pointers ?? [],
            }),
          );
        } catch {
          null;
        }
      },
    }),

    /**
     * 채팅방 미디어 모아보기 (infinite scroll)
     * GET /chatRoom/{chatRoomId}/media?type=ALL|IMAGE|VIDEO&before=...&limit=...
     */
    getChatRoomMedia: build.query({
      query: ({chatRoomId, type = 'ALL', before = null, limit = 30}) => ({
        url: CHAT_ROOM.media(toId(chatRoomId)),
        params: {
          type: String(type || 'ALL').toUpperCase(),
          limit: limit ?? 30,
          ...(before ? {before: String(before)} : {}),
        },
      }),
      providesTags: (result, error, {chatRoomId}) => [
        {type: 'ChatRoomMedia', id: String(chatRoomId)},
      ],
      // 같은 chatRoomId·type이면 같은 캐시 슬롯
      serializeQueryArgs: ({queryArgs}) =>
        `${queryArgs.chatRoomId}_${String(queryArgs.type || 'ALL').toUpperCase()}`,
      merge: (currentCache, incoming, {arg}) => {
        const newItems = Array.isArray(incoming?.items) ? incoming.items : [];
        if (!arg.before || !currentCache) {
          currentCache.items = newItems;
          currentCache.nextBefore = incoming?.nextBefore ?? null;
          return;
        }
        // 중복 제거 merge
        const keyOf = x =>
          `${x?.messageId || ''}|${x?.url || ''}|${x?.orderInMessage ?? ''}`;
        const map = new Map();
        [...(currentCache.items || []), ...newItems].forEach(x => {
          const k = keyOf(x);
          if (k && !map.has(k)) map.set(k, x);
        });
        currentCache.items = Array.from(map.values());
        currentCache.nextBefore = incoming?.nextBefore ?? null;
      },
      forceRefetch: ({currentArg, previousArg}) =>
        currentArg?.before !== previousArg?.before ||
        currentArg?.type !== previousArg?.type,
    }),

    /**
     * 채팅방 단건 조회 (딥링크·푸시 진입용)
     * GET /chatRoom/{chatRoomId}
     */
    getChatRoom: build.query({
      query: chatRoomId => ({url: CHAT_ROOM.one(chatRoomId)}),
      providesTags: (result, error, chatRoomId) => [
        {type: 'ChatRoom', id: String(chatRoomId)},
      ],
    }),

    /* ──────────────────────────────────────
     * MUTATIONS
     * ────────────────────────────────────── */

    /**
     * 채팅방 생성
     * POST /chatRoom/create
     */
    createChatRoom: build.mutation({
      queryFn: async ({roomName, userIds, familyId}) => {
        try {
          const fid = familyId;
          if (!fid) return {error: {data: 'familyId가 없습니다.'}};

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
            {familyId: fid, roomName: trimmedName, userIds: ids},
            {headers: {'Content-Type': 'application/json'}},
          );
          return {data: res.data};
        } catch (err) {
          return {error: {status: err?.response?.status, data: err?.message}};
        }
      },
      invalidatesTags: ['ChatRoom'],
    }),

    /**
     * 채팅방 나가기
     * DELETE /chatRoom/{chatRoomId}/leave
     */
    leaveChatRoom: build.mutation({
      query: chatRoomId => ({
        url: CHAT_ROOM.leave(chatRoomId),
        method: 'DELETE',
      }),
      invalidatesTags: ['ChatRoom'],
    }),

    /**
     * 채팅방 이름 변경 (전체)
     * PATCH /chatRoom/{chatRoomId}/rename?roomName=...
     */
    renameChatRoom: build.mutation({
      query: ({chatRoomId, roomName}) => ({
        url: CHAT_ROOM.rename(chatRoomId),
        method: 'PATCH',
        params: {roomName},
      }),
      invalidatesTags: ['ChatRoom'],
    }),

    /**
     * 채팅방 이름 변경 (내 화면만)
     * PATCH /chatRoom/{chatRoomId}/rename/me
     */
    renameChatRoomForMe: build.mutation({
      query: ({chatRoomId, roomName}) => ({
        url: CHAT_ROOM.renameMe(chatRoomId),
        method: 'PATCH',
        data: {roomName: String(roomName ?? '').trim()},
        headers: {'Content-Type': 'application/json'},
      }),
      invalidatesTags: ['ChatRoom'],
    }),

    /**
     * 채팅방 멤버 추가(초대)
     * POST /chatRoom/{chatRoomId}/addUsers/{userIds}
     */
    addUsersToChatRoom: build.mutation({
      queryFn: async ({chatRoomId, userIds}) => {
        try {
          const rid = toId(chatRoomId);
          if (!rid) return {error: {data: 'chatRoomId가 없습니다.'}};

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
          if (ids.length === 0) return {error: {data: '초대할 유저가 없습니다.'}};

          const res = await apiClient.post(
            CHAT_ROOM.addUsers(rid, ids.join(',')),
            null,
          );
          return {data: res.data};
        } catch (err) {
          return {error: {status: err?.response?.status, data: err?.message}};
        }
      },
      invalidatesTags: (result, error, {chatRoomId}) => [
        {type: 'ChatRoomUsers', id: String(chatRoomId)},
      ],
    }),

    /**
     * 채팅방 알림 ON/OFF
     * PATCH /chatRoom/notification/chatroom?userId=...&chatRoomId=...&isOn=...
     */
    toggleChatRoomNotification: build.mutation({
      query: ({userId, chatRoomId, isOn}) => ({
        url: CHAT_ROOM.notificationChatroom(),
        method: 'PATCH',
        params: {userId, chatRoomId, isOn},
        headers: {'Content-Type': 'application/json'},
      }),
      // slice의 setChatRoomNotificationState는 chatSetting.jsx에서 직접 dispatch
    }),

    /**
     * 전체 채팅방 알림 ON/OFF
     * PATCH /chatRoom/notification/user?userId=...&isOn=...
     */
    toggleAllChatRoomNotification: build.mutation({
      query: ({userId, isOn}) => ({
        url: CHAT_ROOM.notificationUser(),
        method: 'PATCH',
        params: {userId, isOn},
      }),
    }),

    /**
     * 키노 성격(페르소나) 변경
     * PATCH /chatRoom/{chatRoomId}/personality
     */
    updateKinoPersonality: build.mutation({
      query: ({chatRoomId, personality}) => ({
        url: CHAT_ROOM.personality(chatRoomId),
        method: 'PATCH',
        data: {personality},
        headers: {'Content-Type': 'application/json'},
      }),
    }),

    /**
     * 읽음 처리 (REST)
     * POST /chatRoom/{chatRoomId}/read
     */
    markReadRest: build.mutation({
      query: ({chatRoomId, lastReadAt}) => ({
        url: `/chatRoom/${chatRoomId}/read`,
        method: 'POST',
        data: {lastReadAt},
        headers: {'Content-Type': 'application/json'},
      }),
    }),
    notifyMentions: build.mutation({
      query: payload => ({
        url: CHAT_ROOM.notifyMentions(),
        method: 'POST',
        data: payload,
      }),
    }),
  }),
});

export const {
  useGetChatRoomsQuery,
  useGetChatRoomUsersQuery,
  useGetMessagesQuery,
  useLazyGetMessagesQuery,
  useGetReadPointersQuery,
  useGetChatRoomMediaQuery,
  useLazyGetChatRoomMediaQuery,
  useGetChatRoomQuery,
  useLazyGetChatRoomQuery,
  useCreateChatRoomMutation,
  useLeaveChatRoomMutation,
  useRenameChatRoomMutation,
  useRenameChatRoomForMeMutation,
  useAddUsersToChatRoomMutation,
  useToggleChatRoomNotificationMutation,
  useToggleAllChatRoomNotificationMutation,
  useUpdateKinoPersonalityMutation,
  useMarkReadRestMutation,
  useNotifyMentionsMutation,
} = chatApi;
