/**
 * @fileoverview 네비게이션 서비스 유틸리티
 * 
 * 네비게이션이 준비되기 전에 호출된 액션을 큐에 저장하고,
 * 준비되면 실행하는 기능을 제공합니다.
 */

import {
  createNavigationContainerRef,
  CommonActions,
} from '@react-navigation/native';

// ==================== Constants ====================

/** 네비게이션 참조 (createRef는 reset 등 API가 불완전할 수 있어 공식 ref 사용) */
export const navigationRef = createNavigationContainerRef();

/** 대기 중인 네비게이션 액션 배열 */
let pendingActions = [];

/** 설정/알림 화면 진입 시점의 탭 (뒤로가기 시 복귀용, params 전달이 안 될 때 대비) */
let lastFromTabForGlobalScreen = null;

/** 탭 라우트 이름 목록 */
export const TAB_ROUTES = ['홈', '소통', '일정', '추억'];

/**
 * RESET state 정규화: 루트 스택에 'Root' 화면이 없으므로 'Root' → 'Tabs'로 치환
 * @param {Object} state - reset payload
 * @returns {Object} 정규화된 state
 */
function normalizeResetState(state) {
  const routes = state?.routes;
  if (!Array.isArray(routes) || routes.length === 0) return state;
  const first = routes[0];
  if (first?.name === 'Root') {
    return {
      ...state,
      routes: [{...first, name: 'Tabs'}],
    };
  }
  return state;
}

// ==================== Utils ====================

/**
 * 네비게이션이 준비되었는지 확인
 * @returns {boolean} 준비 여부
 */
export function isNavigationReady() {
  return !!navigationRef?.isReady?.();
}

/**
 * 안전한 네비게이션 실행
 * 네비게이션이 준비되지 않았으면 큐에 저장합니다.
 * 
 * @param {string} name - 라우트 이름
 * @param {Object} params - 네비게이션 파라미터
 * @returns {boolean} 실행 성공 여부
 */
export function safeNavigate(name, params) {
  const safeParams = params ?? {};
  if (name === '설정화면' || name === '알림화면') {
    if (safeParams.fromTab) lastFromTabForGlobalScreen = safeParams.fromTab;
  }
  if (isNavigationReady()) {
    navigationRef.navigate(name, safeParams);
    return true;
  }
  pendingActions.push({type: 'NAVIGATE', name, params: safeParams});
  return false;
}

/** 설정/알림 화면 들어올 때 있던 탭 (뒤로가기 시 사용) */
export function getLastFromTabForGlobalScreen() {
  return lastFromTabForGlobalScreen;
}

/** 설정/알림 화면에서 복귀할 탭 저장 (마운트 시 스택에서 읽어 채울 때 사용) */
export function setLastFromTabForGlobalScreen(tab) {
  lastFromTabForGlobalScreen = tab;
}

/**
 * 안전한 네비게이션 리셋 실행
 * 네비게이션이 준비되지 않았으면 큐에 저장합니다.
 * 
 * @param {Object} state - 네비게이션 상태
 * @returns {boolean} 실행 성공 여부
 */
export function safeReset(state) {
  const normalized = normalizeResetState(state);
  if (isNavigationReady()) {
    navigationRef.dispatch(CommonActions.reset(normalized));
    return true;
  }
  pendingActions.push({type: 'RESET', state: normalized});
  return false;
}

/**
 * 루트 스택 상태에서 현재 탭 이름 읽기 (설정/알림 화면에서 뒤로갈 때 사용)
 * @returns {string|null} '홈'|'소통'|'일정'|'추억' 또는 null
 */
export function getCurrentTabFromRootState() {
  try {
    const state =
      navigationRef?.getRootState?.() ?? navigationRef?.getState?.();
    if (!state?.routes?.length) return null;
    const tabsRoute = state.routes.find(r => r?.name === 'Tabs');
    if (!tabsRoute?.state?.routes?.length) return null;
    const idx = tabsRoute.state.index ?? 0;
    const tabName = tabsRoute.state.routes[idx]?.name;
    return TAB_ROUTES.includes(tabName) ? tabName : null;
  } catch {
    return null;
  }
}

/**
 * 대기 중인 네비게이션 액션 실행
 */
export function flushPendingNavigation() {
  if (!isNavigationReady()) {
    return;
  }

  const actions = pendingActions;
  pendingActions = [];

  actions.forEach(a => {
    try {
      if (a.type === 'NAVIGATE') {
        if ((a.name === '설정화면' || a.name === '알림화면') && a.params?.fromTab) {
          lastFromTabForGlobalScreen = a.params.fromTab;
        }
        navigationRef.navigate(a.name, a.params);
      } else if (a.type === 'RESET') {
        navigationRef.dispatch(CommonActions.reset(normalizeResetState(a.state)));
      }
    } catch {
      // 에러 무시
    }
  });
}

// ==================== Tab Navigation Helpers ====================

/**
 * 특정 탭으로 돌아가기 위한 루트 reset state 객체 (화면에서 navigation.dispatch(CommonActions.reset(this)) 할 때 사용)
 */
export function getResetToTabState(tabName) {
  const tabIndex = TAB_ROUTES.indexOf(tabName);
  const safeIndex = tabIndex >= 0 ? tabIndex : 0;
  return {
    index: 0,
    routes: [
      {
        name: 'Tabs',
        state: {
          index: safeIndex,
          routes: TAB_ROUTES.map(name => ({name})),
        },
      },
    ],
  };
}

/**
 * 특정 탭 화면으로 리셋 — 루트를 [Tabs] 한 장으로 바꾸고, Tabs 내부 state.index로 해당 탭 지정
 */
export function resetToTabScreen(tabName) {
  return safeReset(getResetToTabState(tabName));
}

/**
 * 설정/알림 화면에서 뒤로갈 때: Tabs의 특정 탭으로 이동 (navigate가 스택을 정리하고 해당 탭 선택)
 * @param {string} tabName - '홈' | '소통' | '일정' | '추억'
 */
export function goBackToTab(tabName) {
  if (!isNavigationReady()) return false;
  const name = TAB_ROUTES.includes(tabName) ? tabName : '홈';
  try {
    // 루트에서 navigate('Tabs', { screen }) → 설정/알림 pop + 해당 탭으로 전환
    navigationRef.navigate('Tabs', {screen: name});
    return true;
  } catch {
    return resetToTabScreen(name);
  }
}

/**
 * 특정 탭의 중첩된 스택 화면으로 리셋
 * 
 * @param {string} tabName - 탭 이름
 * @param {string} stackRouteName - 스택 내 라우트 이름
 * @param {Object} params - 네비게이션 파라미터
 * @returns {boolean} 실행 성공 여부
 * 
 * @example
 * resetToTabNestedScreen('홈', '홈화면', {userId: '123'});
 */
export function resetToTabNestedScreen(tabName, stackRouteName, params) {
  const tabIndex = TAB_ROUTES.indexOf(tabName);
  const safeIndex = tabIndex >= 0 ? tabIndex : 0;

  // RootNavigator 구조: 최상위 스택에 Tabs가 있음 (Root 화면 없음)
  return safeReset({
    index: 0,
    routes: [
      {
        name: 'Tabs',
        state: {
          index: safeIndex,
          routes: TAB_ROUTES.map(name => {
            if (name !== tabName) {
              return {name};
            }

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
