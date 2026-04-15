/**
 * 앱 이벤트 알림(AppAlert) "오늘 하루 보지 않기" / "다시 보지 않기" 저장소
 * MMKV 키는 useAppAlertPopup과 동일해야 함.
 */
import {EMOTION_PICK_APP_EVENT_ID} from 'config/appEvents';
import mmkvStorage, {mmkvGetStringSync} from 'utils/mmkvStorage';

export const APP_EVENT_DISMISS_KEY_PREFIX = '@kinover/alert/dismissed/';

const nowMs = () => Date.now();

export const parseDismissStored = raw => {
  const v = typeof raw === 'string' ? raw.trim() : '';
  if (!v) return null;
  if (v === 'never') return {mode: 'never'};
  if (v.startsWith('until:')) {
    const ms = Number(v.slice('until:'.length));
    if (!Number.isFinite(ms)) return null;
    return {mode: 'until', untilMs: ms};
  }
  return null;
};

export const isDismissedState = stored => {
  if (!stored) return false;
  if (stored.mode === 'never') return true;
  if (stored.mode === 'until') return nowMs() < stored.untilMs;
  return false;
};

export function getAppEventDismissStorageKey(eventId) {
  if (!eventId) return null;
  return `${APP_EVENT_DISMISS_KEY_PREFIX}${eventId}`;
}

/**
 * 리렌더 타이밍 없이도 dismiss 직후와 동일한 값을 읽기 위해 sync 사용
 */
export function isAppEventDismissedSync(eventId) {
  const key = getAppEventDismissStorageKey(eventId);
  if (!key) return false;
  try {
    const raw = mmkvGetStringSync(key);
    return isDismissedState(parseDismissStored(raw));
  } catch {
    return false;
  }
}

/** Redux `ui.emotionPickAlertDismiss` 저장 형태 */
export function isEmotionPickAlertDismissedRedux(dismiss) {
  if (dismiss == null) return false;
  if (dismiss.kind === 'never') return true;
  if (dismiss.kind === 'until' && Number.isFinite(dismiss.untilMs)) {
    return nowMs() < dismiss.untilMs;
  }
  return false;
}

/**
 * MMKV 레거시 → 스토어 초기값 (첫 프레임·재수화 전에도 "오늘 숨김" 유지)
 */
export function readEmotionPickAlertDismissFromMmkv(eventId) {
  if (!eventId) return null;
  try {
    const raw = mmkvGetStringSync(getAppEventDismissStorageKey(eventId));
    const stored = parseDismissStored(raw);
    if (!stored) return null;
    if (stored.mode === 'never') return {kind: 'never'};
    if (stored.mode === 'until' && Number.isFinite(stored.untilMs)) {
      if (nowMs() < stored.untilMs) return {kind: 'until', untilMs: stored.untilMs};
    }
  } catch {
    null;
  }
  return null;
}

/** 로그아웃/탈퇴 후 ui 초기값이 MMKV 레거시를 다시 읽지 않도록 */
export async function clearEmotionPickAlertDismissMmkvForLogout() {
  try {
    const key = getAppEventDismissStorageKey(EMOTION_PICK_APP_EVENT_ID);
    if (key) await mmkvStorage.removeItem(key);
  } catch {
    null;
  }
}
