import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import HomeStack from './stacks/homeStack';
import CommunicationStack from './stacks/communicationStack';
import ScheduleStack from './stacks/scheduleStack';
import MemoryStack from './stacks/memoryStack';
import {renderTabBarIcon, renderTabBarLabel} from './tabHeaderHelpers';
import {getFocusedRouteNameFromRoute} from '@react-navigation/native';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        keyboardHidesTabBar: true, // 🟡 키보드 올라와도 탭바 숨기지 않게!
      }}
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

          tabBarStyle: {
            position: 'relative',
            // bottom: 0, // 👈 이게 핵심!
            height: 75, // 너가 원하는 탭바 높이

            paddingBottom: Platform.OS === 'ios' ? 15 : 10,
          },
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
            tabBarStyle: shouldHideTab
              ? {
                  position: 'relative',
                  height: 0,
                  opacity: 0,
                }
              : {
                  position: 'relative',
                  // bottom: 0, // 👈 이게 핵심!
                  height: 75, // 너가 원하는 탭바 높이
                  paddingBottom: Platform.OS === 'ios' ? 15 : 10,

                },
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
          tabBarStyle: {
            position: 'relative',
            // bottom: 0, // 👈 이게 핵심!
            height: 75, // 너가 원하는 탭바 높이
            paddingBottom: Platform.OS === 'ios' ? 15 : 10,

          },
        }}
      />
      <Tab.Screen
        name="추억기록"
        component={MemoryStack}
        options={({route}) => {
          const hiddenScreens = ['게시글화면']; // 📌 탭 숨길 화면 목록

          const routeName = getFocusedRouteNameFromRoute(route);

          const shouldHideTab = hiddenScreens.includes(routeName);

          return {
            tabBarLabel: ({focused}) => renderTabBarLabel('추억기록', focused),
            tabBarIcon: ({focused}) =>
              renderTabBarIcon(
                focused,
                'https://i.postimg.cc/3NCVXHm0/Vector-16.png',
                'https://i.postimg.cc/sgz4hhgX/Vector-19.png',
              ),
            tabBarStyle: shouldHideTab
              ? {
                  position: 'relative',
                  height: 0,
                  opacity: 0,
                }
              : {
                  position: 'relative',
                  // bottom: 0, // 👈 이게 핵심!
                  height: 75, // 너가 원하는 탭바 높이
                  paddingBottom: Platform.OS === 'ios' ? 15 : 10,

                },
          };
        }}
      />
    </Tab.Navigator>
  );
}
