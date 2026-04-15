// src/hooks/useActiveAppEvent.js
import {useMemo} from 'react';
import {useSelector} from 'react-redux';
import {APP_EVENTS, EMOTION_PICK_APP_EVENT_ID} from 'config/appEvents';
import {
  isAppEventDismissedSync,
  isEmotionPickAlertDismissedRedux,
} from 'utils/appEventDismissStorage';

const isWithinWindow = (startAt, endAt) => {
  const now = Date.now();

  const s = startAt ? new Date(startAt).getTime() : null;
  const e = endAt ? new Date(endAt).getTime() : null;

  if (s && Number.isFinite(s) && now < s) return false;
  if (e && Number.isFinite(e) && now > e) return false;
  return true;
};

/**
 * @param {Object} opts
 * @param {string} [opts.screen] - 화면 구분 (나중에 이벤트 노출 화면 필터용)
 * @param {boolean} [opts.hideEmotionPickWhenHasEmotion] - true면 감정 선택 이벤트가 있어도, 이미 감정이 선택된 경우 해당 이벤트 제외
 * @param {boolean} [opts.hideEmotionPickOnFirstEntry] - true면 감정 선택 이벤트 제외 (첫 진입 시 가이드만 뜨게)
 * @param {unknown} [opts.emotionDismissInvalidate] - AppAlert 가시성 등 바뀔 때마다 MMKV 기준으로 감정 이벤트 노출 재평가
 */
export default function useActiveAppEvent({
  screen = 'home',
  hideEmotionPickWhenHasEmotion = false,
  hideEmotionPickOnFirstEntry = false,
  emotionDismissInvalidate = 0,
} = {}) {
  const emotionPickDismiss = useSelector(s => s.ui?.emotionPickAlertDismiss ?? null);

  return useMemo(() => {
    const list = Array.isArray(APP_EVENTS) ? APP_EVENTS : [];

    let candidates = list
      .filter(e => e && e.enabled !== false)
      .filter(e => isWithinWindow(e.startAt, e.endAt));

    if (hideEmotionPickWhenHasEmotion) {
      candidates = candidates.filter(e => e?.id !== EMOTION_PICK_APP_EVENT_ID);
    }

    if (hideEmotionPickOnFirstEntry) {
      candidates = candidates.filter(e => e?.id !== EMOTION_PICK_APP_EVENT_ID);
    }

    if (isEmotionPickAlertDismissedRedux(emotionPickDismiss)) {
      candidates = candidates.filter(e => e?.id !== EMOTION_PICK_APP_EVENT_ID);
    }

    if (isAppEventDismissedSync(EMOTION_PICK_APP_EVENT_ID)) {
      candidates = candidates.filter(e => e?.id !== EMOTION_PICK_APP_EVENT_ID);
    }

    candidates.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    return candidates[0] || null;
  }, [
    screen,
    hideEmotionPickWhenHasEmotion,
    hideEmotionPickOnFirstEntry,
    emotionDismissInvalidate,
    emotionPickDismiss,
  ]);
}
