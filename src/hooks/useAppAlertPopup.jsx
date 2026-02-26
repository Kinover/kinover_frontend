// src/hooks/useAppAlertPopup.js
import {useCallback, useEffect, useMemo, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PREFIX = '@kinover/alert/dismissed/';

const nowMs = () => Date.now();

const endOfTodayMs = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
};

const parseStored = v => {
  if (!v) return null;
  if (v === 'never') return {mode: 'never'};
  if (v.startsWith('until:')) {
    const ms = Number(v.replace('until:', ''));
    if (!Number.isFinite(ms)) return null;
    return {mode: 'until', untilMs: ms};
  }
  return null;
};

const isDismissed = stored => {
  if (!stored) return false;
  if (stored.mode === 'never') return true;
  if (stored.mode === 'until') return nowMs() < stored.untilMs;
  return false;
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
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);

  const eventId = event?.id;

  const storageKey = useMemo(() => {
    if (!eventId) return null;
    return `${KEY_PREFIX}${eventId}`;
  }, [eventId]);

  const checkShouldShow = useCallback(async () => {
    if (!enabled) return false;
    if (!eventId) return false;
    if (event?.enabled === false) return false;

 // 기간 제한
    if (!isWithinWindow(event?.startAt, event?.endAt)) return false;

    try {
      const raw = await AsyncStorage.getItem(storageKey);
      const stored = parseStored(raw);
      if (isDismissed(stored)) return false;
      return true;
    } catch (e) {
 // 읽기 실패면 보여주는 편이 낫다
      return true;
    }
  }, [enabled, eventId, event?.enabled, event?.startAt, event?.endAt, storageKey]);

  const open = useCallback(() => {
    setVisible(true);
  }, []);

  const close = useCallback(() => {
    setVisible(false);
  }, []);

  const saveValue = useCallback(
    async value => {
      if (!storageKey) return;
      try {
        await AsyncStorage.setItem(storageKey, value);
      } catch (e) {null}
    },
    [storageKey],
  );

  const dismissToday = useCallback(async () => {
    await saveValue(`until:${endOfTodayMs()}`);
    setVisible(false);
  }, [saveValue]);

  const dismissHours = useCallback(
    async hours => {
      const h = Number(hours);
      const ms = Number.isFinite(h) ? h * 60 * 60 * 1000 : 0;
      await saveValue(`until:${nowMs() + ms}`);
      setVisible(false);
    },
    [saveValue],
  );

  const dismissNever = useCallback(async () => {
    await saveValue('never');
    setVisible(false);
  }, [saveValue]);

 // event 바뀌거나(새 이벤트), enabled/기간 변동 시 자동 체크
  useEffect(() => {
    let mounted = true;

    (async () => {
      setReady(false);
      setVisible(false);

      const ok = await checkShouldShow();
      if (!mounted) return;

      setReady(true);
      if (ok) requestAnimationFrame(() => setVisible(true));
    })();

    return () => {
      mounted = false;
    };
  }, [checkShouldShow]);

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
