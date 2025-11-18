import {useEffect, useRef} from 'react';
import {useDispatch} from 'react-redux';
import {getToken} from '../utils/storage';
import {
  setLastActiveMap,
  setOnlineUserIds,
} from '../features/home/store/familySlice';
import {URLSearchParams} from 'react-native-url-polyfill';



const useFamilyStatusSocket = familyId => {
  const dispatch = useDispatch();
  const socketRef = useRef(null);

  useEffect(() => {
    let socket;

    (async () => {
      const token = await getToken();
      if (!token || !familyId) {
        console.warn('❗ 토큰 또는 familyId 누락');
        return;
      }

      // ✅ iOS ATS: wss + 파라미터 인코딩
      const qs = new URLSearchParams({
        token,
        familyId: String(familyId),
      }).toString();
      const url = `ws://kinover.shop:9090/family-status?${qs}`;
      console.log('[WS /family-status] 연결 시도:', url);

      socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log('[WS /family-status] WebSocket 연결됨:', url);
      };

      socket.onmessage = event => {
        try {
          const list = JSON.parse(event.data);
          if (!Array.isArray(list)) return; // ✅ 배열만 처리(핑/텍스트 방어)

          // ✅ 서버 필드명 online 사용 + ID 문자열 통일
          const onlineIds = list
            .filter(u => u?.online === true)
            .map(u => u.userId);

          const lastActiveMap = list.reduce((acc, u) => {
            acc[String(u.userId)] = u.lastActiveAt ?? null;
            return acc;
          }, {});

          console.log('[WS] 온라인 사용자:', onlineIds);
          dispatch(setOnlineUserIds(onlineIds));
          dispatch(setLastActiveMap(lastActiveMap));
        } catch (e) {
          console.error('[WS /family-status] 메시지 파싱 오류:', e, event.data);
        }
      };

      socket.onerror = e => {
        console.error('[WS /family-status] 오류 발생:', e?.message || e);
      };

      socket.onclose = () => {
        console.log('[WS /family-status] WebSocket 연결 종료됨');
      };
    })();

    return () => {
      if (socketRef.current) {
        console.log('[WS /family-status] WebSocket 연결 해제');
        try {
          socketRef.current.close();
        } catch { /* empty */ }
        socketRef.current = null;
      }
    };
  }, [familyId, dispatch]);
};

export default useFamilyStatusSocket;
