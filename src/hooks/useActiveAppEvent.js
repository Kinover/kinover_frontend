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

export default function useActiveAppEvent({screen = 'home'} = {}) {
  // screen 파라미터는 나중에 "홈에서만 뜨는 이벤트" 같은 필터링에 쓰려고 넣어둠
  return useMemo(() => {
    const list = Array.isArray(APP_EVENTS) ? APP_EVENTS : [];

    const candidates = list
      .filter(e => e && e.enabled !== false)
      .filter(e => isWithinWindow(e.startAt, e.endAt))
      // 필요하면 screen 조건 필터도 추가 가능
      // .filter(e => !e.screens || e.screens.includes(screen))
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    return candidates[0] || null;
  }, [screen]);
}
