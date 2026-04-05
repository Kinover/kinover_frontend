// src/features/chat/hooks/ChatSocket.js
import {AppState} from 'react-native';
import {getToken} from 'utils/storage';
import {
  WS_CHAT_BASE_URL,
  WS_CHAT_PATH,
  CHAT_BATCH_DEBOUNCE_MS,
  RECONNECT_DELAY_BASE_MS,
  RECONNECT_DELAY_MAX_MS,
  WS_HEARTBEAT_INTERVAL_MS,
  WS_HEARTBEAT_TIMEOUT_MS,
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
let started = false;

// 메시지 배칭: 짧은 시간에 여러 건 들어오면 한 번에 디스패치
let messageBatch = [];
let batchTimer = null;

// 전송 큐: 끊김 순간 보낸 메시지를 복구 후 순차 전송
const MAX_OUTGOING_QUEUE = 120;
let outgoingQueue = [];

// Heartbeat: 소켓이 살아있는지 주기적으로 확인
let heartbeatInterval = null;
let heartbeatTimeout = null;
let lastReceivedAt = 0;

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

function enqueueOutgoing(payload) {
  if (!payload) return;
  outgoingQueue.push(payload);
  if (outgoingQueue.length > MAX_OUTGOING_QUEUE) {
    outgoingQueue = outgoingQueue.slice(outgoingQueue.length - MAX_OUTGOING_QUEUE);
  }
}

function flushOutgoingQueue() {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  if (!outgoingQueue.length) return;

  const pending = outgoingQueue;
  outgoingQueue = [];

  for (const payload of pending) {
    try {
      ws.send(JSON.stringify(payload));
    } catch (e) {
      enqueueOutgoing(payload);
      break;
    }
  }
}

function clearHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  if (heartbeatTimeout) {
    clearTimeout(heartbeatTimeout);
    heartbeatTimeout = null;
  }
}

function startHeartbeat() {
  clearHeartbeat();
  heartbeatInterval = setInterval(() => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      clearHeartbeat();
      reconnectIfNeeded();
      return;
    }
    try {
      ws.send(JSON.stringify({type: 'ping'}));
    } catch (e) {
      clearHeartbeat();
      reconnectIfNeeded();
      return;
    }
    // pong 또는 어떤 메시지든 WS_HEARTBEAT_TIMEOUT_MS 내에 안 오면 소켓 죽었다 판단
    heartbeatTimeout = setTimeout(() => {
      const elapsed = Date.now() - lastReceivedAt;
      if (elapsed >= WS_HEARTBEAT_TIMEOUT_MS) {
        clearHeartbeat();
        if (ws) {
          try { ws.close(); } catch (e) { null; }
        }
      }
    }, WS_HEARTBEAT_TIMEOUT_MS);
  }, WS_HEARTBEAT_INTERVAL_MS);
}

function cleanupWsOnly() {
  clearReconnectTimer();
  clearHeartbeat();
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
    lastReceivedAt = Date.now();
    startHeartbeat();
    flushOutgoingQueue();
  };

  ws.onmessage = e => {
    lastReceivedAt = Date.now();
    if (heartbeatTimeout) {
      clearTimeout(heartbeatTimeout);
      heartbeatTimeout = null;
    }
      const data = JSON.parse(e.data);
      const payload =
        data?.payload && typeof data.payload === 'object' ? data.payload : data;
      const type = data?.type ?? payload?.type ?? 'message:new';

 // =========================
 // pong 처리 (heartbeat 응답)
 // =========================
      if (type === 'pong') return;

 // =========================
 // A) 읽음 브로드캐스트 처리 (실시간 unreadCount 갱신용)
 // =========================
      if (type === 'room:read') {
 // payload: { type:'room:read', chatRoomId, userId, lastReadAt }
        const chatRoomId =
          payload?.chatRoomId ??
          payload?.roomId ??
          payload?.chatRoom?.chatRoomId;
        const userId = payload?.userId;
        const lastReadAt = payload?.lastReadAt;

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
      const incomingRoomId = String(
        payload?.chatRoomId ?? payload?.roomId ?? payload?.chatRoom?.chatRoomId ?? '',
      );
      if (!incomingRoomId) return;

      messageBatch.push(payload);
      scheduleFlush();
   
  };


  ws.onclose = () => {
    ws = null;


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
  if (isPausedByBackground) return;
  isPausedByBackground = true;
  cleanupWsOnly();
}

/**
 * 포그라운드 복귀 시 재연결.
 */
export function resumeFromBackground() {
  if (!dispatchRef || !getStateRef || isManuallyClosed) return;
  if (!isPausedByBackground && ws && ws.readyState === WebSocket.OPEN) return;
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
  isManuallyClosed = false;

  if (started) {
    openSocket();
    return () => {};
  }

  started = true;
  openSocket();
  return () => {};
}

export function stopChatSocket() {
  started = false;
  isManuallyClosed = true;
  isPausedByBackground = false;
  connectedToken = null;
  dispatchRef = null;
  getStateRef = null;
  cleanupWsOnly();
  outgoingQueue = [];
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
  if (!payload) return false;

  if (!ws || ws.readyState !== WebSocket.OPEN) {
    enqueueOutgoing(payload);
    reconnectIfNeeded();
    return false;
  }

  try {
    ws.send(JSON.stringify(payload));
    return true;
  } catch (e) {
    enqueueOutgoing(payload);
    reconnectIfNeeded();
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
