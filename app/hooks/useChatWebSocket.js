import { useEffect, useRef, useCallback } from 'react';
import { getToken } from '../utils/storage'; // AsyncStorage 등에서 꺼내는 함수

export default function useChatWebSocket({ onMessage, onOpen, onClose }) {
  const socketRef = useRef(null);

  const connect = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      console.warn('WebSocket: No token found');
      return;
    }

    const ws = new WebSocket(`ws://kinover.shop:9090/chat?token=${token}`);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('[WebSocket] Connected');
      onOpen?.();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage?.(data);
      } catch (error) {
        console.error('[WebSocket] Invalid message format', error);
      }
    };

    ws.onerror = (error) => {
      console.error('[WebSocket] Error:', error.message);
    };

    ws.onclose = (event) => {
      console.log('[WebSocket] Closed:', event.code, event.reason);
      onClose?.();
    };
  }, [onMessage, onOpen, onClose]);

  const sendMessage = useCallback((data) => {
    const ws = socketRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    } else {
      console.warn('[WebSocket] Not connected');
    }
  }, []);

  const disconnect = useCallback(() => {
    socketRef.current?.close();
    socketRef.current = null;
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { sendMessage };
}
