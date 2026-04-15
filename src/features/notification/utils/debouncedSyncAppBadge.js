import store from 'store';
import {syncAppBadge} from './syncAppBadge';

let debounceTimer = null;
const DEBOUNCE_MS = 900;

/**
 * WS 등으로 채팅 목록이 자주 갱신될 때 서버 배지 API를 과호출하지 않도록 디바운스
 */
export function scheduleDebouncedSyncAppBadge() {
  if (debounceTimer != null) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void syncAppBadge({
      dispatch: store.dispatch,
      getState: store.getState,
    }).catch(() => {});
  }, DEBOUNCE_MS);
}
