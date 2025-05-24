import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { getToken } from '../utils/storage';
import { setOnlineUserIds } from '../redux/slices/statusSlice';

const useFamilyStatusSocket = (familyId) => {
  const dispatch = useDispatch();
  const socketRef = useRef(null);

  useEffect(() => {
    let socket;

    getToken().then((token) => {
      if (!token || !familyId) {
        console.warn('❗ 토큰 또는 familyId 누락');
        return;
      }

      const url = `ws://kinover.shop/family-status?token=${token}&familyId=${familyId}`;
      console.log('[WS /family-status] 연결 시도:', url);

      socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log('[WS /family-status] 연결됨');
      };

      socket.onmessage = (event) => {
        try {
          const updatedList = JSON.ㄱparse(event.data); // Array<{ userId: string, isOnline: boolean }>
          const onlineIds = updatedList
            .filter((user) => user.isOnline)
            .map((user) => user.userId);
          dispatch(setOnlineUserIds(onlineIds));
        } catch (e) {
          console.error('[WS /family-status] 메시지 파싱 오류:', e);
        }
      };

      socket.onerror = (e) => {
        console.error('[WS /family-status] 오류:', e?.message || e);
      };

      socket.onclose = () => {
        console.log('[WS /family-status] 연결 종료됨');
      };
    });

    return () => {
      if (socketRef.current) {
        console.log('[WS /family-status] 연결 해제');
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [familyId, dispatch]);
};

export default useFamilyStatusSocket;
