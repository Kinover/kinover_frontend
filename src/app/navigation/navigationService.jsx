// src/navigation/navigationService.js
import * as React from 'react';

export const navigationRef = React.createRef();

let pendingActions = [];

export function isNavigationReady() {
  return !!navigationRef.current?.isReady?.();
}

export function safeNavigate(name, params) {
  if (isNavigationReady()) {
    navigationRef.current?.navigate?.(name, params);
    return true;
  }
  pendingActions.push({type: 'NAVIGATE', name, params});
  return false;
}

export function safeReset(state) {
  if (isNavigationReady()) {
    navigationRef.current?.reset?.(state);
    return true;
  }
  pendingActions.push({type: 'RESET', state});
  return false;
}

export function flushPendingNavigation() {
  if (!isNavigationReady()) return;

  const actions = pendingActions;
  pendingActions = [];

  actions.forEach(a => {
    try {
      if (a.type === 'NAVIGATE') {
        navigationRef.current?.navigate?.(a.name, a.params);
      } else if (a.type === 'RESET') {
        navigationRef.current?.reset?.(a.state);
      }
    } catch {
      null;
    }
  });

  
}

export function resetToTabScreen(tabName, screenName, params) {
  return safeReset({
    index: 0,
    routes: [
      {
        name: 'Tabs',
        state: {
          // ✅ Tabs의 route 배열 순서는 TabNavigator의 Screen 등록 순서와 같아야 함
          routes: [
            {name: '홈'},
            {name: '소통'},
            {name: '일정'},
            {name: '추억'},
          ],
          // ✅ 활성 탭 index
          index: ['홈', '소통', '일정', '추억'].indexOf(tabName),
        },
      },
    ],
  });
}


export function resetToTabNestedScreen(tabName, stackRouteName, params) {
  const tabRoutes = ['홈', '소통', '일정', '추억'];
  const tabIndex = tabRoutes.indexOf(tabName);

  return safeReset({
    index: 0,
    routes: [
      {
        name: 'Tabs',
        state: {
          index: tabIndex >= 0 ? tabIndex : 0,
          routes: tabRoutes.map(name => {
            if (name !== tabName) return {name};

            // ✅ 활성 탭은 “스택 상태를 목적 화면 1개만” 남김
            return {
              name,
              state: {
                index: 0,
                routes: [
                  {
                    name: stackRouteName,
                    params,
                  },
                ],
              },
            };
          }),
        },
      },
    ],
  });
}
