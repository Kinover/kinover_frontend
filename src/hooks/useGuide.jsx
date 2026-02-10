// src/features/common/guide/useGuide.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useState, useEffect, useCallback, useRef} from 'react';

// ✅ "가입/가족참가/가족생성 직후"에만 1로 올려주는 전역 트리거
export const KEY_GUIDE_ENTRY_TRIGGER = '@kinover/guide/entry_trigger_v1';

/**
 * useGuide(storageKey, enabled, options?)
 * - storageKey: 화면별 shown 키 (예: @kinover/guide/home_v2_shown)
 * - enabled: ready 포함해서 true일 때만 체크
 * - options.forceVisible: 개발용 강제 노출
 */
export default function useGuide(storageKey, enabled = false, options = {}) {
  const {forceVisible = false} = options;

  const [visible, setVisible] = useState(false);
  const checkingRef = useRef(false);

  const closeAndRemember = useCallback(async () => {
    setVisible(false);
    try {
      await AsyncStorage.setItem(storageKey, '1'); // ✅ 이 화면 가이드 1회 처리
    } catch (e) {
      // no-op
    }
  }, [storageKey]);

  useEffect(() => {
    if (!enabled) return;
    if (!storageKey) return;
    if (checkingRef.current) return;

    checkingRef.current = true;

    (async () => {
      try {
        // ✅ 개발용: 강제 노출
        if (forceVisible) {
          requestAnimationFrame(() => setVisible(true));
          return;
        }

        // ✅ 1) "이번 진입에서 가이드를 보여줄 자격"이 있는지 확인
        const entry = await AsyncStorage.getItem(KEY_GUIDE_ENTRY_TRIGGER);
        if (entry !== '1') return;

        // ✅ 2) 이 화면 가이드를 이미 봤는지 확인
        const shown = await AsyncStorage.getItem(storageKey);
        if (shown !== '1') {
          requestAnimationFrame(() => setVisible(true));
        }
      } catch (e) {
        // 보수적으로: entry 확인 실패 시엔 띄우지 않음(원하면 여기서 띄우게 바꿔도 됨)
      } finally {
        checkingRef.current = false;
      }
    })();
  }, [enabled, forceVisible, storageKey]);

  return {
    visible,
    closeAndRemember, // ✅ onDone / onRequestClose / secondary 버튼에 그대로 연결
    setVisible,       // 필요하면 외부에서 강제 제어
  };
}
