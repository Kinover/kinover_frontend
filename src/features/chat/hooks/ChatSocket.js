// src/features/chat/socket/chatSocket.js
import {AppState} from 'react-native';
import {getToken} from 'utils/storage';

import {receiveMessageThunk} from '../store/messageThunk';
import {applyReadPointer} from '../store/chatRoomSlice';

const BATCH_DEBOUNCE_MS = 80;

let ws = null;
let reconnectTimer = null;
let reconnectAttempt = 0;
let connectedToken = null;
let isManuallyClosed = false;

let dispatchRef = null;
let getStateRef = null;

// ✅ 메시지 배칭: 짧은 시간에 여러 건 들어오면 한 번에 디스패치
let messageBatch = [];
let batchTimer = null;

function flushMessageBatch() {
  if (batchTimer) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }
  if (messageBatch.length === 0 || !dispatchRef || !getStateRef) return;
  const state = getStateRef();
  const myId = state?.user?.userId ?? state?.auth?.userId ?? null;
  const toFlush = messageBatch;
  messageBatch = [];
  toFlush.forEach(data => {
    dispatchRef(receiveMessageThunk(data, myId));
  });
}

function scheduleFlush() {
  if (batchTimer) return;
  batchTimer = setTimeout(flushMessageBatch, BATCH_DEBOUNCE_MS);
}

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function cleanupWsOnly() {
  clearReconnectTimer();
  if (batchTimer) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }
  flushMessageBatch();

  if (ws) {
    try {
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      ws.close();
    } catch (e) {
      null;
    }
    ws = null;
  }
}

async function openSocket() {
  if (!dispatchRef) return;

  const tokenRaw = await getToken();
  if (!tokenRaw) return;

  const token = encodeURIComponent(tokenRaw);

  if (ws && ws.readyState === WebSocket.OPEN && connectedToken === token) return;

  cleanupWsOnly();
  connectedToken = token;
  isManuallyClosed = false;

  ws = new WebSocket(`ws://kinover.shop:9090/chat?token=${token}`);

  ws.onopen = () => {
    reconnectAttempt = 0;
    console.log('✅ [GLOBAL WS] connected');
  };

  ws.onmessage = e => {
    try {
      const data = JSON.parse(e.data);
      const type = data?.type ?? 'message:new';

      // =========================
      // A) 읽음 브로드캐스트 처리 (실시간 unreadCount 갱신용)
      // =========================
      if (type === 'room:read') {
        // payload: { type:'room:read', chatRoomId, userId, lastReadAt }
        const chatRoomId = data?.chatRoomId;
        const userId = data?.userId;
        const lastReadAt = data?.lastReadAt;

        if (chatRoomId && userId != null && lastReadAt) {
          dispatchRef(
            applyReadPointer({
              chatRoomId,
              userId,
              lastReadAt,
            }),
          );
        }
        return;
      }

      // =========================
      // B) 일반 메시지 처리 (배칭)
      // =========================
      const incomingRoomId = String(data?.chatRoomId ?? '');
      if (!incomingRoomId) return;

      messageBatch.push(data);
      scheduleFlush();
    } catch (err) {
      console.log('❌ [GLOBAL WS] parse fail', err);
    }
  };

  ws.onerror = err => {
    console.log('⚠️ [GLOBAL WS] error', err?.message ?? err);
  };

  ws.onclose = e => {
    ws = null;

    console.log('🔌 [GLOBAL WS] close', e?.code, e?.reason);

    if (isManuallyClosed) return;

    const delay = Math.min(1000 * (reconnectAttempt + 1), 5000);
    reconnectAttempt += 1;

    clearReconnectTimer();
    reconnectTimer = setTimeout(() => {
      openSocket();
    }, delay);
  };
}

/**
 * dispatch + getState 같이 넣어두면,
 * 소켓 수신 시 "내 userId"를 안전하게 꺼내서 isSelf 판별 가능
 */
export function startChatSocket(dispatch, getState) {
  dispatchRef = dispatch;
  getStateRef = getState;

  openSocket();

  const sub = AppState.addEventListener('change', state => {
    if (state === 'active') {
      openSocket();
    }
  });

  return () => {
    sub.remove();
  };
}

export function stopChatSocket() {
  isManuallyClosed = true;
  connectedToken = null;
  dispatchRef = null;
  getStateRef = null;
  cleanupWsOnly();
}

export function isChatSocketOpen() {
  return ws && ws.readyState === WebSocket.OPEN;
}

export function sendChat(payload) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return false;

  try {
    ws.send(JSON.stringify(payload));
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * ✅ 백엔드 WebSocketMessageHandler의 read 이벤트 스펙에 맞춘 전송
 * type: "room:read"
 * chatRoomId: UUID
 * lastReadAt: ISO string or LocalDateTime string
 */
export function sendRead(chatRoomId, lastReadAt) {
  return sendChat({
    type: 'room:read',
    chatRoomId,
    lastReadAt,
  });
}
