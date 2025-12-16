import React, {createContext, useContext, useMemo} from 'react';
import Animated, {useAnimatedStyle, withTiming} from 'react-native-reanimated';
import {BottomTabBar} from '@react-navigation/bottom-tabs';
import LinearGradient from 'react-native-linear-gradient';

const TabBarVisibilityContext = createContext(null);

export function useTabBarVisibility() {
  const ctx = useContext(TabBarVisibilityContext);
  if (!ctx) throw new Error('useTabBarVisibility must be used within Provider');
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

// ✅ 현재 탭 스택에서 “가장 안쪽(활성)” 화면 이름 뽑기
function getFocusedRouteName(state) {
  if (!state) return null;

  let s = state;
  while (s?.routes?.[s.index]?.state) {
    s = s.routes[s.index].state;
  }
  return s?.routes?.[s.index]?.name ?? null;
}

export function AnimatedTabBar(props) {
  const {tabBarTranslateY} = useTabBarVisibility();

  const animStyle = useAnimatedStyle(() => {
    const hidden = tabBarTranslateY.value;
    return {
      transform: [{translateY: withTiming(hidden ? 140 : 0, {duration: 220})}],
      opacity: withTiming(hidden ? 0 : 1, {duration: 180}),
    };
  });

  const R = 18;
  const H = 90;

  const activeTabName = props?.state?.routes?.[props.state.index]?.name;
  const activeTabState = props?.state?.routes?.[props.state.index]?.state;
  const focusedScreenName = getFocusedRouteName(activeTabState);

  /**
   * ✅ 탭바를 “보여줄 화면”만 whitelist로 관리
   * - 각 탭의 루트 화면 이름으로 바꿔줘야 함
   * - focusedScreenName이 null인 경우는 스택 상태가 아직 없을 때(루트)라서 루트로 취급
   */
  const ROOT_SCREENS = {
    홈: '홈',
    소통: '소통',
    일정: '일정',
    추억: '추억',
  };

  const root = ROOT_SCREENS[activeTabName];

  // ✅ 탭바 표시 조건: (루트 상태가 없거나) 현재 화면이 루트일 때만
  const shouldShowTabBar =
    focusedScreenName == null || focusedScreenName === root;

  // ✅ 루트가 아닌 화면이면 탭바 자체를 렌더하지 않음
  if (!shouldShowTabBar) return null;

  // ✅ 그라데이션은 원하면 루트에서만 보이게
  const showGradient = true;

  return (
    <Animated.View
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
      {showGradient && (
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(0,0,0,0.00)', 'rgba(0,0,0,0.06)', 'rgba(0,0,0,0.12)']}
          style={{
            position: 'absolute',
            top: -18,
            left: 0,
            right: 0,
            height: 18,
          }}
        />
      )}

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
