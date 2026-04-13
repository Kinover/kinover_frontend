// src/hooks/useAppAlertPopup.js
import {useCallback, useEffect, useMemo, useState} from 'react';
import mmkvStorage from 'utils/mmkvStorage';

const KEY_PREFIX = '@kinover/alert/dismissed/';

const nowMs = () => Date.now();

/** '오늘 하루 보지 않기' — 다음 날 0시(로컬)까지 숨김 */
const startOfTomorrowMs = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const parseStored = raw => {
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

  const eventId = event?.id ?? null;

  const storageKey = useMemo(() => {
    if (!eventId) return null;
    return `${KEY_PREFIX}${eventId}`;
  }, [eventId]);

  // undefined → null 정규화로 불필요한 checkShouldShow 재생성 방지
  const eventEnabled = event?.enabled ?? null;
  const eventStartAt = event?.startAt ?? null;
  const eventEndAt = event?.endAt ?? null;

  const checkShouldShow = useCallback(async () => {
    if (!enabled) return false;
    if (!eventId) return false;
    if (eventEnabled === false) return false;

 // 기간 제한
    if (!isWithinWindow(eventStartAt, eventEndAt)) return false;

    try {
      const raw = await mmkvStorage.getItem(storageKey);
      const stored = parseStored(raw);
      // MMKV만 신뢰: 이벤트 id가 잠깐 null이 됐다가 돌아와도 "오늘 하루 보지 않기"가 유지됨
      if (isDismissed(stored)) return false;
      return true;
    } catch (e) {
 // 읽기 실패면 보여주는 편이 낫다
      return true;
    }
  }, [enabled, eventId, eventEnabled, eventStartAt, eventEndAt, storageKey]);

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
        await mmkvStorage.setItem(storageKey, value);
      } catch (e) {null}
    },
    [storageKey],
  );

  const dismissToday = useCallback(async () => {
    const until = startOfTomorrowMs();
    await saveValue(`until:${until}`);
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
