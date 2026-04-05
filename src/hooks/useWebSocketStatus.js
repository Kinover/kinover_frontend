import {useEffect, useRef} from 'react';
import {getToken} from '../utils/storage';
import {WS_CHAT_BASE_URL, WS_STATUS_PATH} from 'config/constants';

const useWebSocketStatus = () => {
  const socketRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const connect = async () => {
      const token = await getToken();
      if (!token) {
        return;
      }

      const url = `${WS_CHAT_BASE_URL}${WS_STATUS_PATH}?token=${token}`;

      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => {
        if (!isMounted) return;
      };

      socket.onmessage = event => {
        if (!isMounted) return;
      };

      socket.onerror = e => {
        if (!isMounted) return;
      };

      socket.onclose = () => {
        if (!isMounted) return;
      };
    };

    connect();

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, []);
};

export default useWebSocketStatus;
