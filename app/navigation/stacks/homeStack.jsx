import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {Platform} from 'react-native';
import HomeScreen from '../../screens/home';
import NotificationScreen from '../../screens/home/notification/notificationScreen';
import SettingScreen from '../../screens/home/setting/settingScreen';
import NotificationSettingScreen from '../../screens/home/setting/notificationSettingScreen';
import {
  RenderHeaderHome,
  RenderHeaderTitleLogo,
  RenderGoBackButton,
} from '../tabHeaderHelpers';
import {getResponsiveHeight} from '../../utils/responsive';
import StateScreen from '../../screens/home/stateScreen';

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
        headerStyle: defaultHeaderStyle,
        headerTitleAlign: 'center',
        headerShown: true,
        headerLeft: () => <RenderHeaderTitleLogo />,
        headerTitle: '',
      }}>
      <Stack.Screen
        name="홈"
        component={HomeScreen}
        options={({navigation}) => ({
          headerRight: () => <RenderHeaderHome navigation={navigation} />,
          headerStyle: [defaultHeaderStyle, {backgroundColor: '#FFC84D'}],
        })}
      />

      <Stack.Screen
        name="알림화면"
        component={NotificationScreen}
        options={({navigation}) => ({
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
          headerTitle: '',
        })}
      />

      <Stack.Screen
        name="설정화면"
        component={SettingScreen}
        options={({navigation}) => ({
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
          headerTitle: '',
        })}
      />

      <Stack.Screen
        name="알림설정화면"
        component={NotificationSettingScreen}
        options={({navigation}) => ({
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
          headerTitle: '',
        })}
      />

      <Stack.Screen
        name="감정상태화면"
        component={StateScreen}
        options={({navigation}) => ({
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
          headerTitle: '',
        })}
      />
    </Stack.Navigator>
  );
};

export default HomeStack;
