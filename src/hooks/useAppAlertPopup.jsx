// src/hooks/useAppAlertPopup.js
import {useCallback, useEffect, useMemo, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {mmkvSetStringSync} from 'utils/mmkvStorage';
import {EMOTION_PICK_APP_EVENT_ID} from 'config/appEvents';
import {setEmotionPickAlertDismiss} from 'store/uiSlice';
import {persistor} from 'store';
import {
  getAppEventDismissStorageKey,
  isAppEventDismissedSync,
  isEmotionPickAlertDismissedRedux,
} from 'utils/appEventDismissStorage';

const nowMs = () => Date.now();

/** '오늘 하루 보지 않기' — 다음 날 0시(로컬)까지 숨김 */
const startOfTomorrowMs = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const isWithinWindow = (startAt, endAt) => {
  const n = nowMs();
  const s = startAt ? new Date(startAt).getTime() : null;
  const e = endAt ? new Date(endAt).getTime() : null;
  if (s && Number.isFinite(s) && n < s) return false;
  if (e && Number.isFinite(e) && n > e) return false;
  return true;
};

/**
 * useAppAlertPopup
 * - event: {id, enabled, startAt, endAt, ...}
 * - return: {visible, event, open, close, dismissToday, dismissNever, dismissHours}
 */
export default function useAppAlertPopup(event, {enabled = true} = {}) {
  const dispatch = useDispatch();
  const emotionPickDismiss = useSelector(s => s.ui?.emotionPickAlertDismiss ?? null);

  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  /** dismiss 직후 shouldShowAlert·effect가 MMKV 기준으로 다시 돌도록 (콜백 참조 고정 이슈 방지) */
  const [dismissSuppressRevision, setDismissSuppressRevision] = useState(0);

  const eventId = event?.id ?? null;

  const storageKey = useMemo(() => getAppEventDismissStorageKey(eventId), [eventId]);

  const eventEnabled = event?.enabled ?? null;
  const eventStartAt = event?.startAt ?? null;
  const eventEndAt = event?.endAt ?? null;

  const shouldShowAlert = useCallback(() => {
    if (!enabled) return false;
    if (!eventId) return false;
    if (eventEnabled === false) return false;

    if (!isWithinWindow(eventStartAt, eventEndAt)) return false;

    if (eventId === EMOTION_PICK_APP_EVENT_ID) {
      if (isEmotionPickAlertDismissedRedux(emotionPickDismiss)) return false;
    }

    if (isAppEventDismissedSync(eventId)) return false;
    return true;
  }, [
    enabled,
    eventId,
    eventEnabled,
    eventStartAt,
    eventEndAt,
    dismissSuppressRevision,
    emotionPickDismiss,
  ]);

  const open = useCallback(() => {
    setVisible(true);
  }, []);

  const close = useCallback(() => {
    setVisible(false);
  }, []);

  const dismissToday = useCallback(() => {
    if (!storageKey) return;
    const until = startOfTomorrowMs();
    try {
      mmkvSetStringSync(storageKey, `until:${until}`);
    } catch {
      null;
    }
    if (eventId === EMOTION_PICK_APP_EVENT_ID) {
      dispatch(setEmotionPickAlertDismiss({kind: 'until', untilMs: until}));
      void persistor.flush().catch(() => {});
    }
    setDismissSuppressRevision(r => r + 1);
    setVisible(false);
  }, [dispatch, eventId, storageKey]);

  const dismissHours = useCallback(
    hours => {
      if (!storageKey) return;
      const h = Number(hours);
      const ms = Number.isFinite(h) ? h * 60 * 60 * 1000 : 0;
      const until = nowMs() + ms;
      try {
        mmkvSetStringSync(storageKey, `until:${until}`);
      } catch {
        null;
      }
      if (eventId === EMOTION_PICK_APP_EVENT_ID) {
        dispatch(setEmotionPickAlertDismiss({kind: 'until', untilMs: until}));
        void persistor.flush().catch(() => {});
      }
      setDismissSuppressRevision(r => r + 1);
      setVisible(false);
    },
    [dispatch, eventId, storageKey],
  );

  const dismissNever = useCallback(() => {
    if (!storageKey) return;
    try {
      mmkvSetStringSync(storageKey, 'never');
    } catch {
      null;
    }
    if (eventId === EMOTION_PICK_APP_EVENT_ID) {
      dispatch(setEmotionPickAlertDismiss({kind: 'never'}));
      void persistor.flush().catch(() => {});
    }
    setDismissSuppressRevision(r => r + 1);
    setVisible(false);
  }, [dispatch, eventId, storageKey]);

  useEffect(() => {
    let cancelled = false;

    setReady(false);
    setVisible(false);

    const ok = shouldShowAlert();

    setReady(true);
    if (ok) {
      requestAnimationFrame(() => {
        if (!cancelled) setVisible(true);
      });
    }

    return () => {
      cancelled = true;
    };
  }, [shouldShowAlert]);

  return {
    ready,
    visible,
    event,
    open,
    close,
    dismissToday,
    dismissNever,
    dismissHours,
  };
}
