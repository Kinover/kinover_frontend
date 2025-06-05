import React from 'react';
import {Platform} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {getFocusedRouteNameFromRoute} from '@react-navigation/native';

import HomeStack from './stacks/homeStack';
import CommunicationStack from './stacks/communicationStack';
import ScheduleStack from './stacks/scheduleStack';
import MemoryStack from './stacks/memoryStack';
import {renderTabBarIcon, renderTabBarLabel} from './tabHeaderHelpers';

const Tab = createBottomTabNavigator();

const defaultTabBarStyle = {
  position: 'relative',
  // height: Platform.OS === 'ios' ?  : 75,
};

const hiddenTabBarStyle = {
  position: 'relative',
  height: 0,
  opacity: 0,
};

// 📌 숨겨야 할 화면들 정리
const hideTabBarScreens = {
  소통기록: ['채팅방화면', '가족채팅방화면', '키노상담소화면'],
  추억기록: ['게시글화면'],
};

// 🧩 탭 설정 정보
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

// 🛠️ 옵션 함수
function getTabScreenOptions(name, icon, route) {
  const focusedScreen = getFocusedRouteNameFromRoute(route) || '';
  const shouldHide = hideTabBarScreens[name]?.includes(focusedScreen);

  return {
    tabBarLabel: ({focused}) => renderTabBarLabel(name, focused),
    tabBarIcon: ({focused}) =>
      renderTabBarIcon(focused, icon.focused, icon.default),
    tabBarStyle: shouldHide ? hiddenTabBarStyle : defaultTabBarStyle,
  };
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="감정기록"
      screenOptions={{
        headerShown: false,
        keyboardHidesTabBar: true,
      }}>
      {TABS.map(({name, component, icon}) => (
        <Tab.Screen
          key={name}
          name={name}
          component={component}
          options={({route}) => getTabScreenOptions(name, icon, route)}
        />
      ))}
    </Tab.Navigator>
  );
}
