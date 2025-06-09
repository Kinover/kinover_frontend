import React from 'react';
import {Platform} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

import HomeStack from './stacks/homeStack';
import CommunicationStack from './stacks/communicationStack';
import ScheduleStack from './stacks/scheduleStack';
import MemoryStack from './stacks/memoryStack';
import {renderTabBarIcon, renderTabBarLabel} from './tabHeaderHelpers';

const Tab = createBottomTabNavigator();

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
      focused: 'https://i.postimg.cc/k45KQp31/chat.png',
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

export default function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="감정기록"
      screenOptions={({route}) => {
        const currentTab = TABS.find(tab => tab.name === route.name);

        return {
          keyboardHidesTabBar: true,
          headerShown: false,
          tabBarLabel: ({focused}) => renderTabBarLabel(route.name, focused),
          tabBarIcon: ({focused}) =>
            renderTabBarIcon(
              focused,
              currentTab?.icon.focused,
              currentTab?.icon.default,
            ),
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 0.5,
            borderTopColor: '#eee',
            paddingBottom: Platform.OS === 'ios' ? 20 : 10,
            paddingTop: 8,
            height: Platform.OS === 'ios' ? 90 : 90,
          },
        };
      }}>
      {TABS.map(({name, component}) => (
        <Tab.Screen key={name} name={name} component={component} />
      ))}
    </Tab.Navigator>
  );
}
