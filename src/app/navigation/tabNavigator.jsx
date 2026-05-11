/**
 * @fileoverview 하단 탭 네비게이터 컴포넌트
 * 
 * 메인 앱의 하단 탭 네비게이션을 관리합니다.
 * 홈, 소통, 일정, 추억 탭을 포함합니다.
 */

import React from 'react';
import {Image, Platform} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useSharedValue} from 'react-native-reanimated';

import HomeStack from './stacks/homeStack';
import CommunicationStack from './stacks/communicationStack';
import ScheduleStack from './stacks/scheduleStack';
import MemoryStack from './stacks/memoryStack';
import {AnimatedTabBar, TabBarVisibilityProvider} from './animatedTabBar';
import {TabBarLabel} from './helpers/tabHeaderHelpers';
import {
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from 'utils/responsive';
import {useColors, useIsDark} from 'hooks/useColors';

// ==================== Constants ====================

const Tab = createBottomTabNavigator();

/** 탭바 기본 스타일 (non-color props only) — Android는 커스텀 탭 실측과 맞게 약간 더 높게 */
const tabBarBaseStyle = {
  borderTopLeftRadius: getResponsiveIconSize(15),
  borderTopRightRadius: getResponsiveIconSize(15),
  paddingTop: 8,
  paddingHorizontal: getResponsiveWidth(15),
  height: getResponsiveHeight(Platform.OS === 'android' ? 90 : 83),
};

/** 탭 목록 */
const TABS = [
  {
    name: '홈',
    component: HomeStack,
    icon: require('../../assets/icons/bottomTab/one.png'),
  },
  {
    name: '소통',
    component: CommunicationStack,
    icon: require('../../assets/icons/bottomTab/two.png'),
  },
  {
    name: '일정',
    component: ScheduleStack,
    icon: require('../../assets/icons/bottomTab/three.png'),
  },
  {
    name: '추억',
    component: MemoryStack,
    icon: require('../../assets/icons/bottomTab/four.png'),
  },
];

// ==================== Components ====================

/**
 * 탭 아이콘 컴포넌트
 * @param {Object} props - 컴포넌트 props
 * @param {boolean} props.focused - 포커스 여부
 * @param {number} props.source - 이미지 리소스
 */
function TabIcon({focused, source}) {
  const colors = useColors();
  const iconSize = getResponsiveIconSize(Platform.OS === 'android' ? 32 : 30);
  return (
    <Image
      source={source}
      style={{
        width: iconSize,
        height: iconSize,
        resizeMode: 'contain',
        tintColor: focused ? colors.iconPrimary : colors.textTertiary,
      }}
    />
  );
}

// ==================== Main Component ====================

/**
 * 하단 탭 네비게이터 메인 컴포넌트
 * @returns {JSX.Element} 탭 네비게이터 컴포넌트
 */
export default function TabNavigator() {
  const tabBarHiddenSV = useSharedValue(0);
  const colors = useColors();
  const isDark = useIsDark();

  return (
    <TabBarVisibilityProvider sharedValue={tabBarHiddenSV}>
      <Tab.Navigator
        initialRouteName="홈"
        tabBar={props => (
          <AnimatedTabBar
            {...props}
            key={isDark ? 'tabbar-dark' : 'tabbar-light'}
          />
        )}
        detachInactiveScreens={false}
        screenOptions={({route}) => {
          const currentTab = TABS.find(tab => tab.name === route.name);

          return {
            headerShown: false,
            keyboardHidesTabBar: true,
            animation: 'fade',
            sceneStyle: {
              backgroundColor: colors.surfacePrimary,
            },
            tabBarStyle: {
              ...tabBarBaseStyle,
              backgroundColor: colors.surfacePrimary,
              borderTopColor: colors.borderSubtle,
              backgroundColor: 'transparent',
              elevation: 0,
              shadowOpacity: 0,
              borderTopWidth: 0,
            },
            tabBarLabel: ({focused}) => (
              <TabBarLabel label={route.name} focused={focused} />
            ),
            tabBarIcon: ({focused}) => (
              <TabIcon focused={focused} source={currentTab?.icon} />
            ),
          };
        }}>
        {TABS.map(({name, component}) => (
          <Tab.Screen key={name} name={name} component={component} />
        ))}
      </Tab.Navigator>
    </TabBarVisibilityProvider>
  );
}
