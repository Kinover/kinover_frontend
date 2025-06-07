import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

import HomeStack from './stacks/homeStack';
import CommunicationStack from './stacks/communicationStack';
import ScheduleStack from './stacks/scheduleStack';
import MemoryStack from './stacks/memoryStack';
import { renderTabBarIcon, renderTabBarLabel } from './tabHeaderHelpers';

const Tab = createBottomTabNavigator();

// 📌 숨겨야 할 화면 정의
const hideTabBarScreens = {
  소통기록: ['채팅방화면', '가족채팅방화면', '키노상담소화면','채팅방멤버추가화면','채팅방생성화면'],
  추억기록: ['게시글화면','카테고리화면'],
};

// 📌 탭 구성 정보
const TABS = [
  {
    name: '감정기록',
    component: HomeStack,
    icon: {
      focused: 'https://i.postimg.cc/SxNFGjZS/Vector-17.png',
      default: 'https://i.postimg.cc/RFw0KNFS/Vector-20.png',
    },
  },
  {
    name: '소통기록',
    component: CommunicationStack,
    icon: {
      focused: 'https://i.postimg.cc/zf4cV7s8/Group-1171276556-1.jpg',
      default: 'https://i.postimg.cc/j5NkNNTN/Group-1171276556.jpg',
    },
  },
  {
    name: '일정기록',
    component: ScheduleStack,
    icon: {
      focused: 'https://i.postimg.cc/RZHzbYXC/Vector-9.png',
      default: 'https://i.postimg.cc/02K38wmc/Vector-10.png',
    },
  },
  {
    name: '추억기록',
    component: MemoryStack,
    icon: {
      focused: 'https://i.postimg.cc/3NCVXHm0/Vector-16.png',
      default: 'https://i.postimg.cc/sgz4hhgX/Vector-19.png',
    },
  },
];

// 📌 현재 route에 따라 tabBarStyle 다르게 설정
const getTabBarStyle = (route, tabName) => {
  const focusedRoute = getFocusedRouteNameFromRoute(route) ?? '';
  const shouldHide = hideTabBarScreens[tabName]?.includes(focusedRoute);

  if (shouldHide) {
    return { display: 'none' };
  }

  return {
    backgroundColor: '#fff',
    borderTopWidth: 0.5,
    borderTopColor: '#eee',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 8,
    height: Platform.OS === 'ios' ? 90 : 90,
  };
};

// 📌 Tab Navigator
export default function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="감정기록"
      screenOptions={({ route }) => {
        const currentTab = TABS.find(tab => tab.name === route.name);

        return {
          keyboardHidesTabBar: true, // ✅ 키보드 올라오면 탭바 숨김

          headerShown: false,
          tabBarLabel: ({ focused }) =>
            renderTabBarLabel(route.name, focused),
          tabBarIcon: ({ focused }) =>
            renderTabBarIcon(
              focused,
              currentTab?.icon.focused,
              currentTab?.icon.default,
            ),
          tabBarStyle: getTabBarStyle(route, route.name),
        };
      }}
    >
      {TABS.map(({ name, component }) => (
        <Tab.Screen key={name} name={name} component={component} />
      ))}
    </Tab.Navigator>
  );
}
