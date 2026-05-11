// ref 쓰는 이유: 리스너가 최신 콜백 안 쓰면 stale closure 됨
import {useEffect, useRef} from 'react';
import {AppState} from 'react-native';
// AppState => active, background, inactive 3가지 상태 존재

// ref 쓰는 이유: 리스너가 최신 콜백 안 쓰면 stale closure 됨
export function useAppStateBackground(options = {}) {
  const {onBackground, onActive} = options;
  const appStateRef = useRef(AppState.currentState);
  const onBackgroundRef = useRef(onBackground);
  const onActiveRef = useRef(onActive);

  onBackgroundRef.current = onBackground;
  onActiveRef.current = onActive;

  useEffect(() => {
    // AppState 상태 변경 시 콜백 호출
    const sub = AppState.addEventListener('change', nextState => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;

      // active -> background or inactive
      // 포 -> 백
      if (prev === 'active' && (nextState === 'background' || nextState === 'inactive')) {
        onBackgroundRef.current?.();
      }

      // background or inactive -> active
      // 백 -> 포
      if ((prev === 'background' || prev === 'inactive') && nextState === 'active') {
        onActiveRef.current?.();
      }
    });

    return () => sub?.remove?.();
  }, []);

  const isActive = appStateRef.current === 'active';
  return {isActive};
}
