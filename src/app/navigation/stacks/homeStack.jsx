import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {Platform, View} from 'react-native';
import HomeScreen from '../../../features/home/screens';
import NotificationScreen from '../../../features/notification/screens/NotificationScreen';
import SettingScreen from '../../../features/setting/screens/SettingScreen';
import NotificationSettingScreen from '../../../features/setting/screens/NotificationSettingScreen';
import {
  RenderHeaderHome,
  RenderHeaderTitleLogo,
  RenderGoBackButton,
} from '../helpers/tabHeaderHelpers';
import {getResponsiveHeight} from '../../../utils/responsive';
import StateScreen from '../../../features/home/screens/stateScreen';

const Stack = createStackNavigator();

const getHeaderHeight = () =>
  Platform.OS === 'ios' ? getResponsiveHeight(107.5) : getResponsiveHeight(80);

const defaultHeaderStyle = {
  height: getHeaderHeight(),
  shadowColor: 'transparent',
  elevation: 0,
  borderBottomWidth: 0,
};

const HomeStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="홈"
      screenOptions={{
        gestureEnabled: true, // ← ✅ 이거 true로 되어 있어야 슬라이드 백 가능!
        headerStyle: defaultHeaderStyle,
        headerTitleAlign: 'bottom',
        headerShown: true,
        // headerLeft: () => <RenderHeaderTitleLogo />,
        headerLeft:null,

        headerTitle: '',
      }}>
      <Stack.Screen
        name="홈"
        component={HomeScreen}
        options={({navigation}) => ({
          gestureEnabled: true, // ← ✅ 이거 true로 되어 있어야 슬라이드 백 가능!
          headerTransparent: true, // ✅ 핵심
          headerRight: () => (
            <RenderHeaderHome navigation={navigation} currentScreen="홈" />
          ),
          headerStyle: [defaultHeaderStyle,],
        })}
      />

      <Stack.Screen
        name="알림화면"
        component={NotificationScreen}
        options={({navigation}) => ({
          gestureEnabled: true, // ← ✅ 이거 true로 되어 있어야 슬라이드 백 가능!

          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
          headerTitle: '',
        })}
      />

      <Stack.Screen
        name="설정화면"
        component={SettingScreen}
        options={({navigation}) => ({
          gestureEnabled: true, // ← ✅ 이거 true로 되어 있어야 슬라이드 백 가능!

          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
          headerTitle: '',
        })}
      />

      <Stack.Screen
        name="알림설정화면"
        component={NotificationSettingScreen}
        options={({navigation}) => ({
          gestureEnabled: true, // ← ✅ 이거 true로 되어 있어야 슬라이드 백 가능!

          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
          headerTitle: '',
        })}
      />

      <Stack.Screen
        name="감정상태화면"
        component={StateScreen}
        options={({navigation}) => ({
          gestureEnabled: true, // ← ✅ 이거 true로 되어 있어야 슬라이드 백 가능!

          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
          headerTitle: '',
        })}
      />
    </Stack.Navigator>
  );
};

export default HomeStack;

