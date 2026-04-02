// src/features/chat/store/messageThunk.js
// RTK Query 마이그레이션 후:
//   - fetchMessageThunk, fetchMoreMessagesThunk → 제거 (useGetMessagesQuery, useLazyGetMessagesQuery 사용)
//   - receiveMessageThunk → chatApi.util.updateQueryData로 WS 메시지 RTK Query 캐시에 inject
//   - sendMessageWsThunk → optimistic update도 updateQueryData 사용
//   - 읽음 처리 thunks는 그대로 유지

import {
  sendChat,
  sendRead,
  isChatSocketOpen,
  reconnectIfNeeded,
} from '../hooks/ChatSocket';

import {applyMessagePreview, bumpListRevision, markRoomRead, applyReadPointer, setReadPointers} from './chatRoomSlice';
import {chatApi} from '../services/chatApi';
import {upsertMessageDraft} from '../utils/messageUtils';

/* =========================
 * Utils
 * ========================= */
const normalizePreviewMessage = (msg, fallbackBody = null) => {
  const merged = {...(msg || {})};

  merged.createdAt =
    merged.createdAt ||
    merged.sentAt ||
    merged.updatedAt ||
    fallbackBody?.createdAt ||
    new Date().toISOString();

  merged.content =
    merged.content ??
    fallbackBody?.content ??
    merged.latestMessageContent ??
    '';

  merged.messageType =
    merged.messageType ??
    fallbackBody?.messageType ??
    merged.type ??
    'text';

  if (merged.imageUrls == null && fallbackBody?.imageUrls != null) {
    merged.imageUrls = fallbackBody.imageUrls;
  }
  if (merged.mediaUrls == null && fallbackBody?.mediaUrls != null) {
    merged.mediaUrls = fallbackBody.mediaUrls;
  }

  return merged;
};

const genClientId = () => `c_${Date.now()}_${Math.random().toString(16).slice(2)}`;

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

/* =========================
 * 1) 메시지 send (WS) - optimistic update
 * ========================= */
/**
 * messageBody 최소 권장:
 * { chatRoomId, senderId, content, messageType, imageUrls?, mediaUrls? }
 */
export const sendMessageWsThunk = (messageBody, chatRoomId, userId) => {
  return async dispatch => {
    const clientMessageId = genClientId();
    const nowIso = new Date().toISOString();

    // optimistic 메시지 (RTK Query 캐시에 미리 삽입)
    const optimistic = {
      ...messageBody,
      chatRoomId: String(chatRoomId),
      senderId: userId,
      messageId: `client-${clientMessageId}`,
      clientMessageId,
      createdAt: nowIso,
      localStatus: 'sending',
    };

    // 1) RTK Query 캐시에 optimistic 메시지 삽입
    const patchResult = dispatch(
      chatApi.util.updateQueryData(
        'getMessages',
        {chatRoomId: String(chatRoomId)},
        draft => {
        draft.unshift(optimistic);
        },
      ),
    );

    // 2) 채팅방 목록 preview 갱신
    const previewPayload = normalizePreviewMessage(optimistic, messageBody);
    dispatch(
      applyMessagePreview({
        chatRoomId: String(chatRoomId),
        message: previewPayload,
        isSelf: true,
      }),
    );
    dispatch(bumpListRevision());

    // 3) WS 전송
    try {
      const payloadToSend = {
        content: messageBody?.content ?? '',
        chatRoomId: String(chatRoomId),
        senderId: userId,
        messageType: messageBody?.messageType ?? 'text',
        ...(Array.isArray(messageBody?.mentionUserIds)
          ? {mentionUserIds: messageBody.mentionUserIds}
          : {}),
        ...(Array.isArray(messageBody?.imageUrls)
          ? {imageUrls: messageBody.imageUrls}
          : {}),
        ...(Array.isArray(messageBody?.mediaUrls)
          ? {mediaUrls: messageBody.mediaUrls}
          : {}),
        clientMessageId,
      };

      let ok = sendChat(payloadToSend);
      if (!ok) {
        reconnectIfNeeded();
        await wait(420);
        ok = sendChat(payloadToSend);
      }
      if (!ok) throw new Error('WebSocket not connected');

      // 채팅 멘션 알림 생성
      if (
        Array.isArray(payloadToSend.mentionUserIds) &&
        payloadToSend.mentionUserIds.length > 0
      ) {
        dispatch(
          chatApi.endpoints.notifyMentions.initiate({
            chatRoomId,
            senderId: userId,
            contentPreview: payloadToSend.content ?? '',
            mentionUserIds: payloadToSend.mentionUserIds,
            roomName: null,
          }),
        );
      }

      return {ok: true, clientMessageId};
    } catch (e) {
      // WS 전송 실패 시 optimistic 메시지 롤백
      patchResult.undo();
      return {ok: false, clientMessageId};
    }
  };
};

/* =========================
 * 2) WS 수신 처리
 * ========================= */
/**
 * WebSocket에서 새 메시지 수신 시 RTK Query 캐시에 inject
 */
export const receiveMessageThunk = (incomingMessage, userId) => {
  return async dispatch => {
    const chatRoomId =
      incomingMessage?.chatRoomId ??
      incomingMessage?.chatRoom?.chatRoomId ??
      incomingMessage?.roomId;

    if (chatRoomId == null) return;

    const rid = String(chatRoomId);

    // RTK Query 캐시에 메시지 inject (중복·optimistic 교체 포함)
    dispatch(
      chatApi.util.updateQueryData('getMessages', {chatRoomId: rid}, draft => {
        upsertMessageDraft(draft, incomingMessage);
      }),
    );

    // 채팅방 목록 preview 갱신
    const previewPayload = normalizePreviewMessage(incomingMessage, null);
    const authorId =
      incomingMessage?.authorId ??
      incomingMessage?.userId ??
      incomingMessage?.senderId ??
      incomingMessage?.author?.id;
    const isSelf = userId != null ? String(authorId) === String(userId) : false;

    dispatch(
      applyMessagePreview({
        chatRoomId: rid,
        message: previewPayload,
        isSelf,
      }),
    );

    dispatch(bumpListRevision());
  };
};

/**
 * WS에서 오는 room:read 브로드캐스트 처리
 * payload: { type:'room:read', chatRoomId, userId, lastReadAt }
 */
export const receiveReadPointerThunk = payload => {
  return async (dispatch, getState) => {
    const rid = String(payload?.chatRoomId ?? '');
    const readerId = payload?.userId;
    const lastReadAt = payload?.lastReadAt;

    if (!rid || readerId == null || !lastReadAt) return;

    dispatch(
      applyReadPointer({
        chatRoomId: rid,
        userId: readerId,
        lastReadAt,
      }),
    );

    const state = getState?.();
    const myId = state?.user?.userId ?? state?.auth?.userId ?? null;

    if (myId != null && String(myId) === String(readerId)) {
      dispatch(markRoomRead(rid));
    }
  };
};

/* =========================
 * 3) 읽음 처리 (REST + WS)
 * ========================= */
/**
 * REST 저장
 * POST /api/chatRoom/{chatRoomId}/read
 */
export const markReadRestThunk = (chatRoomId, lastReadAt) => {
  return async dispatch => {
    try {
      const req = dispatch(
        chatApi.endpoints.markReadRest.initiate({chatRoomId, lastReadAt}),
      );
      await req.unwrap();
      req.unsubscribe();

      dispatch(markRoomRead(String(chatRoomId)));
      dispatch(
        applyReadPointer({
          chatRoomId: String(chatRoomId),
          userId: null,
          lastReadAt,
        }),
      );
    } catch {
      // apiClient 인터셉터가 공통 에러 처리
    }
  };
};

/**
 * WS 읽음 전송: type=room:read
 */
export const markReadWsThunk = (chatRoomId, lastReadAt) => {
  return async (dispatch, getState) => {
    const ok = isChatSocketOpen();
    if (!ok) return {ok: false};

    const sent = sendRead(chatRoomId, lastReadAt);
    if (!sent) return {ok: false};

    const state = getState?.();
    const myId = state?.user?.userId ?? state?.auth?.userId ?? null;

    if (myId != null) {
      dispatch(
        applyReadPointer({
          chatRoomId: String(chatRoomId),
          userId: myId,
          lastReadAt,
        }),
      );
      dispatch(markRoomRead(String(chatRoomId)));
    }

    return {ok: true};
  };
};

/**
 * 읽음 포인터 조회 (REST) - 초기 세팅용
 * GET /api/chatRoom/{chatRoomId}/readPointers
 * RTK Query getReadPointers 쿼리의 onQueryFulfilled에서도 처리되지만
 * 직접 dispatch가 필요한 경우 유지
 */
export const fetchReadPointersThunk = chatRoomId => {
  return async dispatch => {
    try {
      const req = dispatch(
        chatApi.endpoints.getReadPointers.initiate(chatRoomId, {
          forceRefetch: true,
        }),
      );
      const data = await req.unwrap();
      req.unsubscribe();
      dispatch(
        setReadPointers({
          chatRoomId: String(chatRoomId),
          pointers: data?.pointers ?? [],
        }),
      );
    } catch {
      // 에러 무시 (apiClient 인터셉터 처리)
    }
  };
};
