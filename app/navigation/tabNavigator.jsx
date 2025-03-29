import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import HomeStack from './stacks/homeStack';
import CommunicationStack from './stacks/communicationStack';
import ScheduleStack from './stacks/scheduleStack';
import MemoryStack from './stacks/memoryStack';
import {renderTabBarIcon, renderTabBarLabel} from './tabHeaderHelpers';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';


const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{headerShown: false}}
      initialRouteName="감정기록">
      <Tab.Screen
        name="감정기록"
        component={HomeStack}
        options={{
          tabBarLabel: ({focused}) => renderTabBarLabel('감정기록', focused),
          tabBarIcon: ({focused}) =>
            renderTabBarIcon(
              focused,
              'https://i.postimg.cc/SxNFGjZS/Vector-17.png',
              'https://i.postimg.cc/RFw0KNFS/Vector-20.png',
            ),
        }}
      />
      <Tab.Screen
        name="소통기록"
        component={CommunicationStack}
        options={({route}) => {
          const hiddenScreens = [
            '채팅방화면',
            '가족채팅방화면',
            '키노상담소화면',
          ];

          // 현재 활성화된 스택 화면 이름 찾기
          const routeName = getFocusedRouteNameFromRoute(route);

          const shouldHideTab = hiddenScreens.includes(routeName);

          return {
            tabBarLabel: ({focused}) => renderTabBarLabel('소통기록', focused),
            tabBarIcon: ({focused}) =>
              renderTabBarIcon(
                focused,
                'https://i.postimg.cc/zf4cV7s8/Group-1171276556-1.jpg',
                'https://i.postimg.cc/j5NkNNTN/Group-1171276556.jpg',
              ),
            tabBarStyle: shouldHideTab ? {display: 'none'} : undefined,
          };
        }}
      />

      <Tab.Screen
        name="일정기록"
        component={ScheduleStack}
        options={{
          tabBarLabel: ({focused}) => renderTabBarLabel('일정기록', focused),
          tabBarIcon: ({focused}) =>
            renderTabBarIcon(
              focused,
              'https://i.postimg.cc/RZHzbYXC/Vector-9.png',
              'https://i.postimg.cc/02K38wmc/Vector-10.png',
            ),
        }}
      />
      <Tab.Screen
        name="추억기록"
        component={MemoryStack}
        options={{
          tabBarLabel: ({focused}) => renderTabBarLabel('추억기록', focused),
          tabBarIcon: ({focused}) =>
            renderTabBarIcon(
              focused,
              'https://i.postimg.cc/3NCVXHm0/Vector-16.png',
              'https://i.postimg.cc/sgz4hhgX/Vector-19.png',
            ),
        }}
      />
    </Tab.Navigator>
  );
}
