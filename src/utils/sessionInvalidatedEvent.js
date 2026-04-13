/**
 * apiClient는 Redux에 접근하지 않으므로,
 * 세션 무효(409 중복 전화, 403 ACCOUNT_INVALIDATED 등) 시 앱 루트에서 로그아웃·안내를 처리합니다.
 */
let listener = null;

export function subscribeSessionInvalidated(handler) {
  const fn = typeof handler === 'function' ? handler : null;
  listener = fn;
  return () => {
    if (listener === fn) {
      listener = null;
    }
  };
}

/**
 * @param {{ message?: string, code?: string, provider?: string }} payload
 */
export function notifySessionInvalidated(payload) {
  try {
    listener?.(payload && typeof payload === 'object' ? payload : {});
  } catch {
    /* noop */
  }
}
