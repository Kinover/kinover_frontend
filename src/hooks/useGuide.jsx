// src/features/common/guide/useGuide.js
import {useState, useEffect, useCallback, useRef} from 'react';
import mmkvStorage from 'utils/mmkvStorage';

// 가입/가족 참가/가족 생성 직후에만 올리는 전역 트리거
export const KEY_GUIDE_ENTRY_TRIGGER = '@kinover/guide/entry_trigger_v1';

/** 회원가입/설정 완료 직후 첫 메인 진입 시 이벤트/감정 모달 숨김용 (설정 완료 화면에서 설정) */
export const KEY_FIRST_ENTRY_AFTER_SETUP = '@kinover/guide/first_entry_after_setup_v1';

/** 회원가입/설정 완료 시 초기화할 가이드 "봤음" 키 목록 (다시 가이드 뜨게) */
export const GUIDE_SHOWN_KEYS = [
  '@kinover/guide/home_v2_shown',
  '@kinover/guide/home_v3_shown',
  '@kinover/guide/schedule_v1_shown',
  '@kinover/guide/memory_v1_shown',
  '@kinover/guide/chat_v1_shown',
  '@kinover/guide/chat_v2_shown',
  '@kinover/guide/chat_v3_shown',
  '@kinover/guide/chat_room_v1_shown',
  '@kinover/guide/kino_chat_room_v1_shown',
];

/**
 * 가이드 "봤음" 플래그 전부 삭제 (설정 완료 시 호출 → 각 탭 진입 시 가이드 다시 노출)
 */
export async function resetGuideShownKeys() {
  try {
    await mmkvStorage.multiRemove(GUIDE_SHOWN_KEYS);
  } catch (e) {
    // no-op
  }
}

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
      await mmkvStorage.setItem(storageKey, '1');
    } catch (e) {
      // no-op
    }
  }, [storageKey]);

  // enabled가 false일 때는 체크 플래그 초기화 → 나중에 true 되면 다시 검사
  useEffect(() => {
    if (!enabled) {
      checkingRef.current = false;
      return;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    if (!storageKey) return;
    if (checkingRef.current) return;

    checkingRef.current = true;

    (async () => {
      try {
        // 개발용 강제 노출
        if (forceVisible) {
          requestAnimationFrame(() => setVisible(true));
          return;
        }

        // 이미 본 가이드는 다시 띄우지 않는다.
        const shown = await mmkvStorage.getItem(storageKey);
        if (shown === '1') return;

        // 회원가입/설정 완료 직후에만 가이드를 띄운다.
        const entryTrigger = await mmkvStorage.getItem(KEY_GUIDE_ENTRY_TRIGGER);
        const firstEntry = await mmkvStorage.getItem(KEY_FIRST_ENTRY_AFTER_SETUP);
        if (entryTrigger !== '1' && firstEntry !== '1') return;

        requestAnimationFrame(() => setVisible(true));
      } catch (e) {
        // 읽기 실패 시 보수적으로 안 띄움
      } finally {
        checkingRef.current = false;
      }
    })();
  }, [enabled, forceVisible, storageKey]);

  return {
    visible,
    closeAndRemember,
    setVisible,
  };
}
