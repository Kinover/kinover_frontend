// TabNavigator.jsx 상단 imports에 Image가 아직 없으면 추가
import React from 'react';
import {Image} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
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
import {useSharedValue} from 'react-native-reanimated';
import { COLORS } from 'styles/style';

const Tab = createBottomTabNavigator();

const tabBarBaseStyle = {
  backgroundColor: 'white',
  borderTopColor: '#F9F9F9',
  borderTopLeftRadius: getResponsiveIconSize(15),
  borderTopRightRadius: getResponsiveIconSize(15),
  paddingTop: 8,
  paddingHorizontal: getResponsiveWidth(15),
  height: getResponsiveHeight(90),
};

const TABS = [
  {
    name: '홈',
    component: HomeStack,
    icon: require('../../assets/icons/tab/one.png'),
  },
  {
    name: '소통',
    component: CommunicationStack,
    icon: require('../../assets/icons/tab/two.png'),
  },
  {
    name: '일정',
    component: ScheduleStack,
    icon: require('../../assets/icons/tab/three.png'),
  },
  {
    name: '추억',
    component: MemoryStack,
    icon: require('../../assets/icons/tab/four.png'),
  },
];

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
            tabBarLabel: ({focused}) => renderTabBarLabel(route.name, focused),
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

// ✅ 로컬 require 이미지를 source로 받고 tintColor만 변경
function TabIcon({focused, source}) {
  return (
    <Image
      source={source}
      style={{
        width: getResponsiveIconSize(30),
        height: getResponsiveIconSize(30),
        resizeMode: 'contain',
        tintColor: focused ? 'black' : COLORS.textTertiary ,
      }}
    />
  );
}
