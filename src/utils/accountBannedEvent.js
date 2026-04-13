/**
 * apiClient는 Redux store를 참조할 수 없으므로,
 * 403 ACCOUNT_BANNED 시 앱 루트에서 로그아웃·알림을 처리하도록 이벤트로 전달합니다.
 */
let listener = null;

export function subscribeAccountBanned(handler) {
  const fn = typeof handler === 'function' ? handler : null;
  listener = fn;
  return () => {
    if (listener === fn) {
      listener = null;
    }
  };
}

export function notifyAccountBanned(message) {
  try {
    listener?.(message);
  } catch {
    /* noop */
  }
}
