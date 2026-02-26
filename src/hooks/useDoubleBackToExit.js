// 안드로이드 홈에서 뒤로가기 두 번이면 종료
import {useEffect, useRef} from 'react';
import {BackHandler, Platform, ToastAndroid} from 'react-native';

const EXIT_MSG = '한 번 더 누르면 종료됩니다.';
const DOUBLE_BACK_MS = 2000;

export function useDoubleBackToExit(enabled = true) {
  const lastBackRef = useRef(0);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    if (Platform.OS !== 'android' || !enabled) return;

    function onBack() {
      if (!enabledRef.current) return false;

      const now = Date.now();
      if (now - lastBackRef.current < DOUBLE_BACK_MS) {
        lastBackRef.current = 0;
        BackHandler.exitApp();
        return true;
      }

      lastBackRef.current = now;
      ToastAndroid.show(EXIT_MSG, ToastAndroid.SHORT);
      return true;
    }

    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [enabled])}