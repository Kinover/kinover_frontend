import { useEffect } from 'react';
import { getToken } from '../utils/storage';

const useWebSocketStatus = () => {
  useEffect(() => {
    let socket;

    getToken().then((token) => {
      if (!token) {
        console.warn('[WS /status] 토큰 없음');
        return;
      }

      const url = `ws://kinover.shop:9090/status?token=${token}`;
      console.log('[WS /status] 연결 시도 URL:', url);

      socket = new WebSocket(url);

      socket.onopen = () => {
        console.log('[WS /status] 연결됨');
      };

      socket.onmessage = (event) => {
        console.log('[WS /status] 메시지 수신:', event.data);
      };

      socket.onerror = (e) => {
        console.error('[WS /status] 오류:', e?.message || e);
      };

      socket.onclose = () => {
        console.log('[WS /status] 연결 끊김');
      };
    });

    return () => {
      if (socket) {
        console.log('[WS /status] 연결 해제 시도');
        socket.close();
        socket = null;
      }
    };
  }, []);
};

export default useWebSocketStatus;
