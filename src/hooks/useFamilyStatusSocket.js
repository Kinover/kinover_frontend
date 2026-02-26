import {useEffect, useRef, useCallback} from 'react';
import {AppState} from 'react-native';
import {useDispatch} from 'react-redux';
import {getToken} from '../utils/storage';
import {
  setLastActiveMap,
  setOnlineUserIds,
} from '../features/home/store/familySlice';
import {WS_CHAT_BASE_URL, WS_FAMILY_STATUS_PATH} from 'config/constants';

const useFamilyStatusSocket = familyId => {
  const dispatch = useDispatch();
  const socketRef = useRef(null);
  const familyIdRef = useRef(familyId);
  familyIdRef.current = familyId;

  const connect = useCallback(async () => {
    const fid = familyIdRef.current;
    const token = await getToken();
    if (!token || !fid) return;

    if (socketRef.current) {
      try {
        socketRef.current.close();
      } catch {}
      socketRef.current = null;
    }

    const qs =
      'token=' +
      encodeURIComponent(token) +
      '&familyId=' +
      encodeURIComponent(String(fid));
    const url = `${WS_CHAT_BASE_URL}${WS_FAMILY_STATUS_PATH}?${qs}`;

    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => {
      if (__DEV__) console.log('[WS /family-status] WebSocket 연결됨');
    };

    socket.onmessage = event => {
      try {
        const list = JSON.parse(event.data);
        if (!Array.isArray(list)) return;

        const onlineIds = list
          .filter(u => u?.online === true)
          .map(u => u.userId);

        const lastActiveMap = list.reduce((acc, u) => {
          acc[String(u.userId)] = u.lastActiveAt ?? null;
          return acc;
        }, {});

        dispatch(setOnlineUserIds(onlineIds));
        dispatch(setLastActiveMap(lastActiveMap));
      } catch (e) {
        if (__DEV__) console.error('[WS /family-status] 메시지 파싱 오류:', e);
      }
    };

    socket.onerror = e => {
      if (__DEV__) console.error('[WS /family-status] 오류:', e?.message || e);
    };

    socket.onclose = () => {
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [dispatch]);

  const closeSocket = useCallback(() => {
    if (socketRef.current) {
      try {
        socketRef.current.close();
      } catch {}
      socketRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!familyId) return;

    connect();

    const sub = AppState.addEventListener('change', state => {
      if (state === 'background' || state === 'inactive') {
        closeSocket();
      } else if (state === 'active') {
        connect();
      }
    });

    return () => {
      sub?.remove?.();
      closeSocket();
    };
  }, [familyId, connect, closeSocket]);
};

export default useFamilyStatusSocket;
