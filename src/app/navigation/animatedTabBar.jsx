import React, {createContext, useContext, useMemo, useEffect} from 'react';
import {View, TouchableOpacity, StyleSheet, Platform} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import {BlurView} from '@react-native-community/blur';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {hapticSelection, hapticLight} from 'utils/haptic';
import {useColors, useIsDark} from 'hooks/useColors';

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

function getFocusedRouteName(state) {
  if (!state) return null;

  let s = state;
  while (s?.routes?.[s.index]?.state) {
    s = s.routes[s.index].state;
  }
  return s?.routes?.[s.index]?.name ?? null;
}

/* =========================
 * Tab Button (with motion)
 * ========================= */

function AnimatedTabButton({
  route,
  focused,
  descriptor,
  navigation,
  onHaptic,
  rootScreenName,
}) {
  const options = descriptor?.options || {};
  const renderIcon = options.tabBarIcon;
  const renderLabel = options.tabBarLabel;

 // press 애니메이션
  const pressScale = useSharedValue(1);
  const pressOpacity = useSharedValue(1);

 // focused 상태 애니메이션
  const focusedScale = useSharedValue(focused ? 1.1 : 1);

  useEffect(() => {
    focusedScale.value = withSpring(focused ? 1.1 : 1, {damping: 12, stiffness: 200});
  }, [focused, focusedScale]);

  const animStyle = useAnimatedStyle(() => {
    return {
      transform: [{scale: focusedScale.value * pressScale.value}],
      opacity: pressOpacity.value,
    };
  });

  const onPressIn = () => {
    pressScale.value = withTiming(0.94, {duration: 90});
    pressOpacity.value = withTiming(0.85, {duration: 90});
  };

  const onPressOut = () => {
    pressScale.value = withSequence(
      withTiming(1.06, {duration: 110}),
      withSpring(1, {damping: 10, stiffness: 220}),
    );
    pressOpacity.value = withTiming(1, {duration: 120});
  };

  const onPress = () => {
    onHaptic?.();

    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (event.defaultPrevented) return;

 // - 각 탭이 Stack을 품고 있다는 전제
 // - rootScreenName(예: '홈', '소통', '일정', '추억')으로 스택의 initial screen으로 보내기
    if (focused) {
      const root = rootScreenName || route.name;

 // (1) 보통 케이스: "탭 route + 내부 stack screen" 지정
 // => navigation.navigate('홈', { screen: '홈' }) 같은 형태
      try {
        navigation.navigate(route.name, {screen: root});
        return;
      } catch {
 // ignore
      }

 // (2) fallback: 그래도 안 되면 탭만 다시 네비게이트 (구조가 다를 때)
      try {
        navigation.navigate(route.name);
      } catch {
        null;
      }
      return;
    }

 // 다른 탭으로 이동
    navigation.navigate(route.name);
  };

  const onLongPress = () => {
    navigation.emit({type: 'tabLongPress', target: route.key});
  };

  return (
    <TouchableOpacity
      key={route.key}
      accessible={true}
      accessibilityRole="tab"
      accessibilityLabel={route.name}
      accessibilityState={{selected: focused}}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={1}
      style={styles.item}>
      <Animated.View style={[styles.itemInner, animStyle]}>
        {typeof renderIcon === 'function'
          ? renderIcon({focused, color: undefined, size: undefined})
          : null}
        {typeof renderLabel === 'function'
          ? renderLabel({focused, color: undefined})
          : null}
      </Animated.View>
    </TouchableOpacity>
  );
}

/* =========================
 * Animated TabBar
 * ========================= */

export function AnimatedTabBar(props) {
  const {tabBarTranslateY} = useTabBarVisibility();
  const colors = useColors();
  const isDark = useIsDark();

  const insets = useSafeAreaInsets();
  const rawInsetBottom = Number(insets?.bottom ?? 0);
  // Android는 기본적으로 window가 system navigation bar 영역을 제외하는 경우가 많아서
  // "추정 네비바 높이"를 더하면 탭바 내부에 불필요한 빈 공간이 생길 수 있음.
  // 탭바에서는 safe-area insets.bottom만 신뢰한다.
  const navInset = Platform.OS === 'android' ? rawInsetBottom : 0;

  /** Android: 탭 영역을 iOS 대비 살짝 넉넉히 (터치·가독) */
  const tabBarBodyPx = Platform.OS === 'android' ? 94 : 84;
  const H = tabBarBodyPx + navInset;

  const activeTabName = props?.state?.routes?.[props.state.index]?.name;
  const activeTabState = props?.state?.routes?.[props.state.index]?.state;
  const focusedScreenName = getFocusedRouteName(activeTabState);

 // "각 탭의 기본(루트) 스크린 이름"
 // - 여기 값은 "각 탭 Stack.Navigator의 initialRouteName" 과 같아야 함
  const ROOT_SCREENS = {
    홈: '홈',
    소통: '소통',
    일정: '일정',
    추억: '추억',
 // 만약 탭 이름/스택 initialRouteName이 다르면 여기만 맞춰주면 됨
  };

  const root = ROOT_SCREENS[activeTabName];
  const shouldShowTabBar =
    focusedScreenName == null || focusedScreenName === root;

  const animStyle = useAnimatedStyle(() => {
    const hidden = tabBarTranslateY.value || !shouldShowTabBar;

    return {
      transform: [{translateY: withTiming(hidden ? 140 : 0, {duration: 220})}],
      opacity: withTiming(hidden ? 0 : 1, {duration: 180}),
    };
  });

  const onHaptic = () => {
    if (Platform.OS === 'android') hapticLight();
    else hapticSelection();
  };

  return (
    <Animated.View
      pointerEvents={shouldShowTabBar ? 'auto' : 'none'}
      style={[
        styles.wrapper,
        {
          height: H,
          backgroundColor:
            Platform.OS === 'android'
              ? colors.surfacePrimary
              : 'transparent',
        },
        animStyle,
      ]}>

      {Platform.OS === 'ios' ? (
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType={isDark ? 'dark' : 'xlight'}
          blurAmount={24}
          reducedTransparencyFallbackColor={
            isDark ? colors.surfacePrimary : 'white'
          }
        />
      ) : null}

      <View
        style={[styles.separator, {backgroundColor: colors.borderSubtle}]}
      />

      <View
        style={[
          styles.row,
          {
            paddingBottom: 14 + navInset,
            paddingTop: Platform.OS === 'android' ? 12 : 0,
          },
        ]}>
        {props.state.routes.map((route, index) => {
          const focused = props.state.index === index;
          const descriptor = props.descriptors?.[route.key];

          return (
            <AnimatedTabButton
              key={route.key}
              route={route}
              focused={focused}
              descriptor={descriptor}
              navigation={props.navigation}
              onHaptic={onHaptic}
              rootScreenName={ROOT_SCREENS[route.name]} // 여기!
            />
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 9999,
    elevation: Platform.OS === 'android' ? 8 : 0,
  },
  separator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    // paddingBottom은 navInset 포함해 인라인으로 동적 적용
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
