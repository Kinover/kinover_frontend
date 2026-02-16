// src/hooks/useNavigateToWhere.js
import {useCallback} from 'react';
import {StackActions, useNavigation} from '@react-navigation/native';

/**
 * 목적:
 * - "최상단에 root(Auth/홈 등)가 실제로 존재할 때만 reset" 수행
 * - 존재하지 않으면 현재 네비게이터에서 안전하게 navigate/replace로 fallback
 *
 * 사용 예:
 * navigateToWhere({ root: 'Auth', screen: '유저정보세팅화면', params })
 * navigateToWhere({ screen: '유저정보세팅화면', params, replace: true }) // 현재 스택에서만 이동
 */
export function useNavigateToWhere() {
  const navigation = useNavigation();

  const navigateToWhere = useCallback(
    ({root, tab, screen, params, replace = false} = {}) => {
      const state = navigation?.getState?.();
      const routeNames = state?.routeNames ?? [];

      // 0) root가 "진짜 존재하는지"부터 확인
      const hasRoot = !!root && routeNames.includes(root);

      // 1) root reset이 가능한 구조면: 기존 로직대로 reset (단, 존재할 때만)
      if (hasRoot) {
        let rootRoute = {name: root};

        if (tab) {
          // root -> tab -> screen
          rootRoute.state = {
            routes: [
              {
                name: tab,
                ...(screen && {
                  state: {
                    routes: [{name: screen, params}],
                  },
                }),
              },
            ],
          };
        } else if (screen) {
          // root -> screen
          rootRoute.state = {
            routes: [{name: screen, params}],
          };
        }

        navigation.reset({
          index: 0,
          routes: [rootRoute],
        });
        return;
      }

      /**
       * 2) root가 없으면(=지금 지윤 앱 구조처럼 RootScreen이 분기 렌더링하는 경우)
       * reset은 "not handled" 터질 가능성이 높음 → 안전 fallback
       */

      // 2-1) tab + screen: 탭 네비 구조일 때 흔히 쓰는 형태로 시도
      if (tab) {
        // e.g. navigation.navigate('Tabs', { screen: 'HomeTab', params: { screen:'...', params }})
        // 여기서는 "tab이 현재 네비에 존재한다" 가정하에 시도
        try {
          if (screen) {
            navigation.navigate(tab, {screen, params});
          } else {
            navigation.navigate(tab, params);
          }
          return;
        } catch (e) {
          console.warn('[useNavigateToWhere] tab navigate failed:', e?.message);
        }
      }

      // 2-2) screen만 있으면: 현재 스택에서 이동/교체가 가장 안전
      if (screen) {
        try {
          if (replace && navigation?.dispatch) {
            navigation.dispatch(StackActions.replace(screen, params));
          } else {
            navigation.navigate(screen, params);
          }
          return;
        } catch (e) {
          console.warn('[useNavigateToWhere] screen navigate failed:', e?.message);
        }
      }

      // 2-3) root만 있는데 root가 없는 경우: 아무것도 못함
      if (root && !hasRoot) {
        console.warn(
          `[useNavigateToWhere] root("${root}")가 현재 네비게이터에 없습니다. routeNames=`,
          routeNames,
        );
        return;
      }

      console.warn('[useNavigateToWhere] 이동 정보가 부족합니다.', {
        root,
        tab,
        screen,
      });
    },
    [navigation],
  );

  return navigateToWhere;
}
