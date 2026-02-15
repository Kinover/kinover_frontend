// src/hooks/useActiveAppEvent.js
import {useMemo} from 'react';
import { APP_EVENTS } from 'config/appEvents';

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
 */
export default function useActiveAppEvent({
  screen = 'home',
  hideEmotionPickWhenHasEmotion = false,
} = {}) {
  return useMemo(() => {
    const list = Array.isArray(APP_EVENTS) ? APP_EVENTS : [];

    let candidates = list
      .filter(e => e && e.enabled !== false)
      .filter(e => isWithinWindow(e.startAt, e.endAt));

    // 감정 선택 모달: 이미 감정이 선택된 상태면 이벤트 목록에서 제외
    if (hideEmotionPickWhenHasEmotion) {
      candidates = candidates.filter(
        e => e?.id !== 'emotion_pick_today_2026_01',
      );
    }

    candidates.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    return candidates[0] || null;
  }, [screen, hideEmotionPickWhenHasEmotion]);
}
