// ref 쓰는 이유: 리스너가 최신 콜백 안 쓰면 stale closure 됨
import {useEffect, useRef} from 'react';
import {AppState} from 'react-native';

// ref 쓰는 이유: 리스너가 최신 콜백 안 쓰면 stale closure 됨
export function useAppStateBackground(options = {}) {
  const {onBackground, onActive} = options;
  const appStateRef = useRef(AppState.currentState);
  const onBackgroundRef = useRef(onBackground);
  const onActiveRef = useRef(onActive);

  onBackgroundRef.current = onBackground;
  onActiveRef.current = onActive;

  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;

      if (prev === 'active' && (nextState === 'background' || nextState === 'inactive')) {
        onBackgroundRef.current?.();
      }

      if ((prev === 'background' || prev === 'inactive') && nextState === 'active') {
        onActiveRef.current?.();
      }
    });

    return () => sub?.remove?.();
  }, []);

  const isActive = appStateRef.current === 'active';
  return {isActive};
}
