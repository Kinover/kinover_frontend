// hooks/useChatWebSocket.js
import {useEffect, useRef, useCallback} from 'react';
import {getToken} from 'utils/storage';

export default function useChatWebSocket({
  // ✅ 서버에서 받은 raw msg를 여기로 올려줌
  onMessage, // (msg) => void
  onOpen,
  onClose,

  // ✅ 옵션: 재연결
  enableReconnect = true,
  maxBackoffMs = 5000,
}) {
  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptRef = useRef(0);

  const cleanup = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    const ws = socketRef.current;
    if (ws) {
      try {
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
        ws.close();
      } catch {
        null;
      }
      socketRef.current = null;
    }
  }, []);

  const connect = useCallback(async () => {
    // ✅ 토큰을 먼저 검사하고 encode는 나중에
    const raw = await getToken();
    if (!raw) {
      console.warn('[WebSocket] No token found');
      return;
    }
    const token = encodeURIComponent(raw);

    // ✅ 이미 OPEN이면 재연결 금지
    const existing = socketRef.current;
    if (existing && existing.readyState === WebSocket.OPEN) return;

    // ✅ 기존 소켓 정리 (중복 연결 방지)
    cleanup();

    const ws = new WebSocket(`ws://kinover.shop:9090/chat?token=${token}`);
    socketRef.current = ws;

    ws.onopen = () => {
      reconnectAttemptRef.current = 0;
      onOpen?.();
    };

    ws.onmessage = event => {
      try {
        const msg = JSON.parse(event.data);
        onMessage?.(msg);
      } catch (e) {
        console.error('[WebSocket] Invalid message format', e);
      }
    };

    ws.onerror = e => {
      // RN에서 e.message가 없을 때도 많아서 그대로 출력
      console.error('[WebSocket] Error:', e);
    };

    ws.onclose = event => {
      onClose?.(event);

      // ✅ 재연결 (선택)
      if (!enableReconnect) return;

      const attempt = reconnectAttemptRef.current++;
      const delay = Math.min(1000 * (attempt + 1), maxBackoffMs);

      reconnectTimerRef.current = setTimeout(() => {
        connect();
      }, delay);
    };
  }, [cleanup, onMessage, onOpen, onClose, enableReconnect, maxBackoffMs]);

  const sendMessage = useCallback(data => {
    const ws = socketRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
      return true;
    }
    console.warn('[WebSocket] Not connected');
    return false;
  }, []);

  useEffect(() => {
    connect();
    return () => cleanup();
  }, [connect, cleanup]);

  return {
    socketRef, // ✅ 필요하면 밖에서 readyState 체크 가능
    sendMessage,
    reconnect: connect,
    disconnect: cleanup,
  };
}
