// TabNavigator.jsx
import React from 'react';
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
    icon: {
      default: 'https://i.postimg.cc/RFw0KNFS/Vector-20.png',
    },
  },
  {
    name: '소통',
    component: CommunicationStack,
    icon: {
      default: 'https://i.postimg.cc/SN3tKTt9/Group-1171276556.png',
    },
  },
  {
    name: '일정',
    component: ScheduleStack,
    icon: {
      default: 'https://i.postimg.cc/02K38wmc/Vector-10.png',
    },
  },
  {
    name: '추억',
    component: MemoryStack,
    icon: {
      default: 'https://i.postimg.cc/63WZwKrn/Images.png',
    },
  },
];

export default function TabNavigator() {
  const tabBarHiddenSV = useSharedValue(0); // 0: 보임, 1: 숨김

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
              backgroundColor: 'transparent', // ✅ wrapper가 배경/그림자 담당
              elevation: 0, // ✅ Android 기본 그림자 제거
              shadowOpacity: 0, // ✅ iOS 기본 그림자 제거
              borderTopWidth: 0, // ✅ 경계선도 wrapper에서 처리
            },
            tabBarLabel: ({focused}) => renderTabBarLabel(route.name, focused),
            tabBarIcon: ({focused}) => (
              <TabIcon focused={focused} uri={currentTab?.icon?.default} />
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

// ✅ default 이미지만 쓰고, focused일 때 tintColor만 변경
function TabIcon({focused, uri}) {
  return (
    <ImageWithTint
      uri={uri}
      // tintColor={focused ? '#111827' : '#9CA3AF'}
      tintColor={focused ? '#525252' : '#9CA3AF'}

    />
  );
}

// ✅ 아이콘 이미지 컴포넌트 (사이즈 통일)
import {Image} from 'react-native';
function ImageWithTint({uri, tintColor}) {
  return (
    <Image
      source={{uri}}
      style={{
        width: getResponsiveIconSize(22),
        height: getResponsiveIconSize(22),
        resizeMode: 'contain',
        tintColor,
      }}
    />
  );
}
