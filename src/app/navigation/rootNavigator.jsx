// src/navigation/RootNavigator.jsx
import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

// import Tabs from './TabsNavigator';
import {TabNavigator} from '.';

import SettingScreen from 'features/setting/screens/SettingScreen';
import NotificationSettingScreen from 'features/setting/screens/NotificationSettingScreen';
import NotificationScreen from 'features/notification/screens/NotificationScreen';

import {RenderHeaderBackButton} from './helpers/tabHeaderHelpers';
import {Platform} from 'react-native';
import {getResponsiveHeight} from 'utils/responsive';

const Stack = createStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      {/* 메인 탭 */}
      <Stack.Screen name="Tabs" component={TabNavigator} />

      {/* ===== 전역 화면 ===== */}
      <Stack.Screen
        name="설정화면"
        component={SettingScreen}
        options={({navigation, route}) => ({
          headerShown: true,
          headerStyle: {
            height:
              Platform.OS === 'ios'
                ? getResponsiveHeight(107.5)
                : getResponsiveHeight(70),
            shadowColor: 'transparent',
            elevation: 0,
            borderBottomWidth: 0,
          },
          headerTitle: '',
          headerLeft: () => (
            <RenderHeaderBackButton navigation={navigation} route={route} />
          ),
        })}
      />

      <Stack.Screen
        name="알림설정화면"
        component={NotificationSettingScreen}
        options={({navigation, route}) => ({
          headerShown: true,
          headerStyle: {
            height:
              Platform.OS === 'ios'
                ? getResponsiveHeight(107.5)
                : getResponsiveHeight(70),
            shadowColor: 'transparent',
            elevation: 0,
            borderBottomWidth: 0,
          },
          headerTitle: '',
          headerLeft: () => (
            <RenderHeaderBackButton navigation={navigation} route={route} />
          ),
        })}
      />

      <Stack.Screen
        name="알림화면"
        component={NotificationScreen}
        options={({navigation, route}) => ({
          headerShown: true,
          headerStyle: {
            height:
              Platform.OS === 'ios'
                ? getResponsiveHeight(107.5)
                : getResponsiveHeight(70),
            shadowColor: 'transparent',
            elevation: 0,
            borderBottomWidth: 0,
          },
          headerTitle: '',
          headerLeft: () => (
            <RenderHeaderBackButton navigation={navigation} route={route} />
          ),
        })}
      />
    </Stack.Navigator>
  );
}
