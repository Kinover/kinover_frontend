import React, {createContext, useContext, useMemo} from 'react';
import Animated, {useAnimatedStyle, withTiming} from 'react-native-reanimated';
import {BottomTabBar} from '@react-navigation/bottom-tabs';
import LinearGradient from 'react-native-linear-gradient';

/* =========================
 * Context
 * ========================= */

const TabBarVisibilityContext = createContext(null);

export function useTabBarVisibility() {
  const ctx = useContext(TabBarVisibilityContext);
  if (!ctx) {
    throw new Error('useTabBarVisibility must be used within Provider');
  }
  return ctx;
}

export function TabBarVisibilityProvider({children, sharedValue}) {
  const value = useMemo(() => ({tabBarTranslateY: sharedValue}), [sharedValue]);
  return (
    <TabBarVisibilityContext.Provider value={value}>
      {children}
    </TabBarVisibilityContext.Provider>
  );
}

/* =========================
 * Utils
 * ========================= */

// ✅ 현재 탭 스택에서 가장 안쪽(활성) 화면 이름
function getFocusedRouteName(state) {
  if (!state) return null;

  let s = state;
  while (s?.routes?.[s.index]?.state) {
    s = s.routes[s.index].state;
  }
  return s?.routes?.[s.index]?.name ?? null;
}

/* =========================
 * Animated TabBar
 * ========================= */

export function AnimatedTabBar(props) {
  const {tabBarTranslateY} = useTabBarVisibility();

  const R = 18; // radius (참고용)
  const H = 90; // tab bar height

  const activeTabName = props?.state?.routes?.[props.state.index]?.name;
  const activeTabState = props?.state?.routes?.[props.state.index]?.state;
  const focusedScreenName = getFocusedRouteName(activeTabState);

  /**
   * ✅ 각 탭의 "루트 화면 이름"
   * - 네비 구조에 맞게 반드시 실제 route name으로 맞춰야 함
   */
  const ROOT_SCREENS = {
    홈: '홈',
    소통: '소통',
    일정: '일정',
    추억: '추억',
  };

  const root = ROOT_SCREENS[activeTabName];

  /**
   * ✅ 탭바를 보여줄 조건
   * - 스택 상태가 없을 때 (루트)
   * - 또는 현재 화면이 루트일 때
   */
  const shouldShowTabBar =
    focusedScreenName == null || focusedScreenName === root;

  /**
   * ✅ 핵심 포인트
   * - ❌ return null 하지 않음
   * - ⭕ 항상 마운트
   * - 애니메이션 + pointerEvents로만 제어
   */
  const animStyle = useAnimatedStyle(() => {
    const hidden = tabBarTranslateY.value || !shouldShowTabBar;

    return {
      transform: [
        {
          translateY: withTiming(hidden ? 140 : 0, {
            duration: 220,
          }),
        },
      ],
      opacity: withTiming(hidden ? 0 : 1, {
        duration: 180,
      }),
    };
  });

  const showGradient = true;

  return (
    <Animated.View
      pointerEvents={shouldShowTabBar ? 'auto' : 'none'}
      style={[
        {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: H,
          backgroundColor: 'white',
          overflow: 'visible',
          zIndex: 10,
        },
        animStyle,
      ]}>
      {/* ✅ 상단 그림자용 그라데이션 */}
      {showGradient && (
        <LinearGradient
          pointerEvents="none"
          colors={[
            'rgba(0,0,0,0.00)',
            'rgba(0,0,0,0.06)',
            'rgba(0,0,0,0.12)',
          ]}
          style={{
            position: 'absolute',
            top: -18,
            left: 0,
            right: 0,
            height: 18,
          }}
        />
      )}

      {/* ✅ 실제 탭바 (항상 마운트됨) */}
      <BottomTabBar
        {...props}
        style={[
          props?.style,
          {
            backgroundColor: 'transparent',
            elevation: 0,
            shadowOpacity: 0,
            borderTopWidth: 0,
          },
        ]}
      />
    </Animated.View>
  );
}
