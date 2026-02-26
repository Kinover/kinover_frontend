/**
 * 실시간 네트워크 연결 상태 감지
 * - 오프라인 시 사용자 알림
 * - 재연결 시 콜백 실행(소켓 재연결, API 재시도 등)
 *
 * 재연결 시: registerReconnectCallback(cb) 로 등록한 cb 가 호출됩니다.
 * - 소켓: ChatSocket.reconnectIfNeeded() 호출
 * - API: dispatch(fetchXXXThunk()) 등
 */
import {useState, useEffect, useRef} from 'react';
import {Alert} from 'react-native';

let reconnectCallbacks = [];

export function registerReconnectCallback(cb) {
  if (typeof cb !== 'function') return;
  reconnectCallbacks.push(cb);
  return () => {
    reconnectCallbacks = reconnectCallbacks.filter(c => c !== cb);
  };
}

function runReconnectCallbacks() {
  reconnectCallbacks.forEach(cb => {
    try {
      cb();
    } catch (e) {
      console.warn('[useNetworkStatus] reconnect callback error:', e);
    }
  });
}

export default function useNetworkStatus(options = {}) {
  const {alertWhenOffline = true, alertWhenReconnected = true} = options;
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    let unsubscribe = () => {};

    const setup = async () => {
      try {
        const NetInfo = require('@react-native-community/netinfo').default;
        const state = await NetInfo.fetch();
        const connected = state?.isConnected ?? true;
        setIsConnected(connected);
        setIsInternetReachable(state?.isInternetReachable ?? true);
        if (!connected) {
          wasOfflineRef.current = true;
          if (alertWhenOffline) {
            Alert.alert(
              '연결 끊김',
              '인터넷 연결이 끊겼어요. 연결을 확인해 주세요.',
              [{text: '확인'}],
            );
          }
        }

        unsubscribe = NetInfo.addEventListener(nextState => {
          const conn = nextState?.isConnected ?? true;
          if (!conn) {
            wasOfflineRef.current = true;
            setIsConnected(false);
            if (alertWhenOffline) {
              Alert.alert(
                '연결 끊김',
                '인터넷 연결이 끊겼어요. 연결을 확인해 주세요.',
                [{text: '확인'}],
              );
            }
          } else {
            const wasOffline = wasOfflineRef.current;
            setIsConnected(true);
            if (nextState?.isInternetReachable != null) {
              setIsInternetReachable(nextState.isInternetReachable);
            }
            if (wasOffline) {
              wasOfflineRef.current = false;
              if (alertWhenReconnected) {
                Alert.alert(
                  '연결 복구',
                  '연결이 복구되었어요. 일부 데이터는 새로고침될 수 있어요.',
                  [{text: '확인'}],
                );
              }
              runReconnectCallbacks();
            }
          }
        });
      } catch (e) {
        console.warn('[useNetworkStatus] NetInfo not available:', e?.message);
      }
    };

    setup();
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [alertWhenOffline, alertWhenReconnected]);

  return {
    isConnected: isConnected && isInternetReachable !== false,
    isInternetReachable,
  };
}
