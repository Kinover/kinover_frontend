import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import TabBarWrapper from './helpers/tabBarWrapper';
import HomeStack from './stacks/homeStack';
import CommunicationStack from './stacks/communicationStack';
import ScheduleStack from './stacks/scheduleStack';
import MemoryStack from './stacks/memoryStack';

import {renderTabBarIcon, renderTabBarLabel} from './helpers/tabHeaderHelpers';
import {getResponsiveHeight, getResponsiveIconSize, getResponsiveWidth} from '../../utils/responsive';

const Tab = createBottomTabNavigator();


const tabBarBaseStyle = {
  backgroundColor: 'white',
  borderTopColor: '#F9F9F9',
  borderTopLeftRadius: getResponsiveIconSize(15),
  borderTopRightRadius: getResponsiveIconSize(15),
  paddingTop: 8,
  paddingHorizontal: getResponsiveWidth(15),
  height: getResponsiveHeight(90)
};
const TABS = [
  {
    name: '홈',
    component: HomeStack,
    icon: {
      focused: 'https://i.postimg.cc/SxNFGjZS/Vector-17.png',
      default: 'https://i.postimg.cc/RFw0KNFS/Vector-20.png',
    },
  },
  {
    name: '소통',
    component: CommunicationStack,
    icon: {
      focused: 'https://i.postimg.cc/k45KQp31/chat.png',
      default: 'https://i.postimg.cc/j5NkNNTN/Group-1171276556.jpg',
    },
  },
  {
    name: '일정',
    component: ScheduleStack,
    icon: {
      focused: 'https://i.postimg.cc/RZHzbYXC/Vector-9.png',
      default: 'https://i.postimg.cc/02K38wmc/Vector-10.png',
    },
  },
  {
    name: '추억',
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
      initialRouteName="홈"
      tabBar={props => <TabBarWrapper {...props} />}
      screenOptions={({route}) => {
        const currentTab = TABS.find(tab => tab.name === route.name);

        return {
          headerShown: false,
          keyboardHidesTabBar: true,
          tabBarStyle: tabBarBaseStyle,
          tabBarLabel: ({focused}) => renderTabBarLabel(route.name, focused),
          tabBarIcon: ({focused}) =>
            renderTabBarIcon(
              focused,
              currentTab?.icon.focused,
              currentTab?.icon.default,
            ),
        };
      }}>
      {TABS.map(({name, component}) => (
        <Tab.Screen key={name} name={name} component={component} />
      ))}
    </Tab.Navigator>
  );
}
