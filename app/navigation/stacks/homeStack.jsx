import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import HomeScreen from '../../screens/home';
import NotificationScreen from '../../screens/home/notification/notificationScreen';
import {RenderHeaderLeft1, RenderHeaderLogo, RenderHeaderTitleLogo} from '../tabHeaderHelpers';
import {RenderHeaderRightSetting} from '../tabHeaderHelpers';
import {RenderGoBackButton} from '../tabHeaderHelpers';
import {Image, Platform, View} from 'react-native';
import {getResponsiveWidth, getResponsiveHeight} from '../../utils/responsive';
import SettingScreen from '../../screens/home/setting/settingScreen';
import NotificationSettingScreen from '../../screens/home/setting/notificationSettingScreen';

const Stack = createStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator
      initialRouteName="감정화면"
      screenOptions={({navigation}) => ({
        // ✅ 객체 구조분해 필수!
        headerStyle: {
          borderBottomWidth: 0,
          shadowOpacity: 0,
          elevation: 0,
          height:
            Platform.OS == 'ios'
              ? getResponsiveHeight(120)
              : getResponsiveHeight(80),
        },
        headerTitleAlign: 'center',
        headerShown: true,
        headerTitle: () => <RenderHeaderTitleLogo />,
      })}>
      <Stack.Screen
        name="감정화면"
        component={HomeScreen}
        options={({navigation}) => ({
          headerLeft: () => <RenderHeaderLeft1 navigation={navigation} />,
          headerRight: () => (
            <RenderHeaderRightSetting navigation={navigation} />
          ),
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
    </Stack.Navigator>
  );
}
