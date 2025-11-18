import {useEffect, useRef} from 'react';
import { getToken } from '../utils/storage';

const useWebSocketStatus = () => {
  const socketRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const connect = async () => {
      const token = await getToken();
      if (!token) {
        console.warn('[WS /status] 토큰 없음');
        return;
      }

      const url = `ws://kinover.shop:9090/status?token=${token}`;
      console.log('[WS /status] 연결 시도 URL:', url);

      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => {
        if (!isMounted) return;
        console.log('[WS /status] 연결됨');
      };

      socket.onmessage = event => {
        if (!isMounted) return;
        console.log('[WS /status] 메시지 수신:', event.data);
      };

      socket.onerror = e => {
        if (!isMounted) return;
        console.error('[WS /status] 오류:', e?.message || e);
      };

      socket.onclose = () => {
        if (!isMounted) return;
        console.log('[WS /status] 연결 끊김');
      };
    };

    connect();

    return () => {
      isMounted = false;
      if (socketRef.current) {
        console.log('[WS /status] 연결 해제 시도');
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, []);
};

export default useWebSocketStatus;
