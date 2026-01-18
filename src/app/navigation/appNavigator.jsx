// src/navigation/appNavigator.jsx
import React from 'react';
import {View, Image} from 'react-native';
import {createStackNavigator} from '@react-navigation/stack';

import {getResponsiveHeight, getResponsiveWidth} from '../../utils/responsive';

import TabNavigator from './tabNavigator';
import AuthNavigator from './authNavigator';
import NotificationScreen from 'features/notification/screens/NotificationScreen';
import {RenderGoBackButton, RenderNotificationBackButton} from './helpers/tabHeaderHelpers';

const AppStack = createStackNavigator();

export default function AppNavigator() {
  return (
    <AppStack.Navigator
      initialRouteName="Auth"
      screenOptions={() => ({
        headerBackTitleVisible: false,
        headerStyle: {
          borderBottomWidth: 0,
          shadowOpacity: 0,
          elevation: 0,
          height: getResponsiveHeight(120),
          display: 'flex',
        },
        headerTitleAlign: 'center',
        headerShown: false,
        headerBackTitle: '',
        headerTitle: () => (
          <View style={{paddingBottom: getResponsiveHeight(10)}}>
            <Image
              source={require('@/assets/images/kinover.png')}
              style={{
                width: getResponsiveWidth(49),
                height: getResponsiveHeight(46),
                resizeMode: 'contain',
              }}
            />
          </View>
        ),
        headerLeft: () => null,
      })}>
      <AppStack.Screen
        name="Auth"
        component={AuthNavigator}
        options={{
          headerShown: false,
          headerBackTitle: '',
          headerBackTitleVisible: false,
        }}
      />

      <AppStack.Screen
        name="Tabs"
        component={TabNavigator}
        options={{
          headerBackTitleVisible: false,
          headerBackTitle: '',
        }}
      />

      {/* ✅ 핵심: "바텀 탭에 안 보이는" 전역 알림 화면 */}
      <AppStack.Screen
        name="알림화면"
        component={NotificationScreen}
        options={({navigation, route}) => ({
          headerShown: true,
          gestureEnabled: true,
          headerLeft: () => (
            <RenderNotificationBackButton navigation={navigation} route={route} />
          ),
          headerTitle: '',
        })}
      />
    </AppStack.Navigator>
  );
}
