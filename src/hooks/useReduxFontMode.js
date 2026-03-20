import {useContext, useSyncExternalStore} from 'react';
import {ReactReduxContext} from 'react-redux';

/**
 * Redux `ui.fontMode`를 구독합니다. `<Provider>` 밖에서는 `useSelector` 대신
 * `useSyncExternalStore`로 스토어가 없을 때 크래시를 피합니다.
 */
export function useReduxFontMode() {
  const {store} = useContext(ReactReduxContext) || {};

  return useSyncExternalStore(
    store != null ? cb => store.subscribe(cb) : () => () => {},
    () => (store != null ? store.getState()?.ui?.fontMode : undefined),
    () => undefined,
  );
}
