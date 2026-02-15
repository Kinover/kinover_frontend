/**
 * @fileoverview 하단 탭 네비게이터 컴포넌트
 * 
 * 메인 앱의 하단 탭 네비게이션을 관리합니다.
 * 홈, 소통, 일정, 추억 탭을 포함합니다.
 */

import React from 'react';
import {Image} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useSharedValue} from 'react-native-reanimated';

import HomeStack from './stacks/homeStack';
import CommunicationStack from './stacks/communicationStack';
import ScheduleStack from './stacks/scheduleStack';
import MemoryStack from './stacks/memoryStack';
import {AnimatedTabBar, TabBarVisibilityProvider} from './animatedTabBar';
import {renderTabBarLabel} from './helpers/tabHeaderHelpers';
import {
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from '../../utils/responsive';
import {COLORS} from 'styles/style';

// ==================== Constants ====================

const Tab = createBottomTabNavigator();

/** 탭바 기본 스타일 */
const tabBarBaseStyle = {
  backgroundColor: 'white',
  borderTopColor: '#F9F9F9',
  borderTopLeftRadius: getResponsiveIconSize(15),
  borderTopRightRadius: getResponsiveIconSize(15),
  paddingTop: 8,
  paddingHorizontal: getResponsiveWidth(15),
  height: getResponsiveHeight(107.5),
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
  return (
    <Image
      source={source}
      style={{
        width: getResponsiveIconSize(30),
        height: getResponsiveIconSize(30),
        resizeMode: 'contain',
        tintColor: focused ? 'black' : COLORS.textTertiary,
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

  return (
    <TabBarVisibilityProvider sharedValue={tabBarHiddenSV}>
      <Tab.Navigator
        initialRouteName="홈"
        tabBar={props => <AnimatedTabBar {...props} />}
        screenOptions={({route}) => {
          const currentTab = TABS.find(tab => tab.name === route.name);

          return {
            headerShown: false,
            keyboardHidesTabBar: true,
            tabBarStyle: {
              ...tabBarBaseStyle,
              backgroundColor: 'transparent',
              elevation: 0,
              shadowOpacity: 0,
              borderTopWidth: 0,
            },
            tabBarLabel: ({focused}) =>
              renderTabBarLabel(route.name, focused),
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
