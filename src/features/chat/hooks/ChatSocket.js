// src/features/chat/socket/chatSocket.js
import {AppState} from 'react-native';
import {getToken} from 'utils/storage';
import {addMessageAndUpdateRoom} from '../utils/messageActions';

let ws = null;
let reconnectTimer = null;
let reconnectAttempt = 0;
let connectedToken = null;
let isManuallyClosed = false;

let dispatchRef = null;

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function cleanupWsOnly() {
  clearReconnectTimer();

  if (ws) {
    try {
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      ws.close();
    } catch (e) {null;}
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
      const msg = JSON.parse(e.data);
      const incomingRoomId = String(msg?.chatRoomId ?? '');
      if (!incomingRoomId) return;

      dispatchRef(
        addMessageAndUpdateRoom({
          chatRoomId: incomingRoomId,
          message: msg,
        }),
      );
    } catch (err) {
      console.log('❌ [GLOBAL WS] parse fail', err);
    }
  };

  ws.onerror = err => {
    console.log('⚠️ [GLOBAL WS] error', err?.message ?? err);
  };

  ws.onclose = e => {
    ws = null;

    // ✅ 원인 파악 로그 (이게 진짜 중요)
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

export function startChatSocket(dispatch) {
  dispatchRef = dispatch;

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
  cleanupWsOnly();
}

// src/features/chat/socket/chatSocket.js
// (기존 코드 유지 + 아래 함수들만 추가)

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
  
