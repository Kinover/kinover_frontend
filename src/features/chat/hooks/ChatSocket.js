// src/features/chat/hooks/ChatSocket.js
import {AppState} from 'react-native';
import {getToken} from 'utils/storage';
import {
  WS_CHAT_BASE_URL,
  WS_CHAT_PATH,
  CHAT_BATCH_DEBOUNCE_MS,
  RECONNECT_DELAY_BASE_MS,
  RECONNECT_DELAY_MAX_MS,
} from 'config/constants';
import {receiveMessageThunk} from '../store/messageThunk';
import {applyReadPointer} from '../store/chatRoomSlice';

let ws = null;
let reconnectTimer = null;
let reconnectAttempt = 0;
let connectedToken = null;
let isManuallyClosed = false;
/** background 진입으로 인한 일시 해제 시, active 시 자동 재연결 */
let isPausedByBackground = false;

let dispatchRef = null;
let getStateRef = null;

// 메시지 배칭: 짧은 시간에 여러 건 들어오면 한 번에 디스패치
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
  batchTimer = setTimeout(flushMessageBatch, CHAT_BATCH_DEBOUNCE_MS);
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

  ws = new WebSocket(`${WS_CHAT_BASE_URL}${WS_CHAT_PATH}?token=${token}`);

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
    if (isPausedByBackground) return;

    const delay = Math.min(
      RECONNECT_DELAY_BASE_MS * (reconnectAttempt + 1),
      RECONNECT_DELAY_MAX_MS,
    );
    reconnectAttempt += 1;

    clearReconnectTimer();
    reconnectTimer = setTimeout(() => {
      openSocket();
    }, delay);
  };
}

/**
 * 백그라운드 진입 시 소켓만 해제. active 시 resumeFromBackground()로 재연결.
 */
export function pauseForBackground() {
  isPausedByBackground = true;
  cleanupWsOnly();
}

/**
 * 포그라운드 복귀 시 재연결.
 */
export function resumeFromBackground() {
  if (!dispatchRef || !getStateRef || isManuallyClosed) return;
  isPausedByBackground = false;
  clearReconnectTimer();
  reconnectAttempt = 0;
  openSocket();
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
      resumeFromBackground();
    } else if (state === 'background' || state === 'inactive') {
      pauseForBackground();
    }
  });

  return () => {
    sub.remove();
  };
}

export function stopChatSocket() {
  isManuallyClosed = true;
  isPausedByBackground = false;
  connectedToken = null;
  dispatchRef = null;
  getStateRef = null;
  cleanupWsOnly();
}

export function isChatSocketOpen() {
  return ws && ws.readyState === WebSocket.OPEN;
}

/**
 * 네트워크 재연결 시 즉시 소켓 재연결용 (useNetworkStatus에서 호출)
 * 앱이 background면 재연결하지 않고, active일 때만 재연결합니다.
 */
export function reconnectIfNeeded() {
  if (!dispatchRef || !getStateRef || isManuallyClosed) return;
  if (isPausedByBackground) return;
  const current = AppState?.currentState;
  if (current && current !== 'active') return;
  clearReconnectTimer();
  reconnectAttempt = 0;
  openSocket();
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
 * 백엔드 WebSocketMessageHandler의 read 이벤트 스펙에 맞춘 전송
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
