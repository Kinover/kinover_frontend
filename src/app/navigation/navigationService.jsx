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

/**
 * ✅ 이제 최상단은 AppNavigator(Stack)이고,
 * 그 안에 RootScreen(Stack)이 있고,
 * RootScreen 안에 Tabs(Screen)가 존재함.
 *
 * 따라서 reset은:
 * routes: [{ name: 'Root', state: { routes: [{name:'Tabs', state:{...}}] } }]
 */

const TAB_ROUTES = ['홈', '소통', '일정', '추억'];

export function resetToTabScreen(tabName) {
  const tabIndex = TAB_ROUTES.indexOf(tabName);
  const safeIndex = tabIndex >= 0 ? tabIndex : 0;

  return safeReset({
    index: 0,
    routes: [
      {
        name: 'Root',
        state: {
          index: 0,
          routes: [
            {
              name: 'Tabs',
              state: {
                routes: TAB_ROUTES.map(name => ({name})),
                index: safeIndex,
              },
            },
          ],
        },
      },
    ],
  });
}

export function resetToTabNestedScreen(tabName, stackRouteName, params) {
  const tabIndex = TAB_ROUTES.indexOf(tabName);
  const safeIndex = tabIndex >= 0 ? tabIndex : 0;

  return safeReset({
    index: 0,
    routes: [
      {
        name: 'Root',
        state: {
          index: 0,
          routes: [
            {
              name: 'Tabs',
              state: {
                index: safeIndex,
                routes: TAB_ROUTES.map(name => {
                  if (name !== tabName) return {name};

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
        },
      },
    ],
  });
}
