import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import ScheduleScreen from '../../screens/schedule';
import {  Text,  Platform,} from 'react-native';
import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveFontSize,
} from '../../utils/responsive';
import {RenderHeaderHome} from '../tabHeaderHelpers';
import SettingScreen from '../../screens/home/setting/settingScreen';
import NotificationScreen from '../../screens/notification/notificationScreen';
import {RenderGoBackButton} from '../tabHeaderHelpers';
import NotificationSettingScreen from '../../screens/home/setting/notificationSettingScreen';

const Stack = createStackNavigator();

export default function ScheduleStack() {
  return (
    <Stack.Navigator
      initialRouteName="일정"
      screenOptions={({navigation}) => ({
        gestureEnabled: true, // ← ✅ 이거 true로 되어 있어야 슬라이드 백 가능!

        // ✅ 객체 구조분해 필수!
        headerShown: true,
        headerStyle: {
          borderBottomWidth: 0,
          shadowOpacity: 0,
          elevation: 0,
          height:
            Platform.OS == 'ios'
              ? getResponsiveHeight(107.5)
              : getResponsiveHeight(80),
        },
        headerTitleAlign: 'left',
        headerLeft: () => null,
        headerTitle: () => (
          <Text
            style={{
              fontFamily: 'Pretendard-Bold',
              fontWeight: 'bold',
              fontSize: getResponsiveFontSize(24),
              // color: '#4D4D4D',
              color: 'black',
              lineHeight: getResponsiveHeight(30),
              textAlignVertical:'center',

            }}>
            일정
          </Text>
        ),
        headerTitleContainerStyle: {
          paddingLeft: getResponsiveWidth(12),
        },
        headerRight: () => (
          <RenderHeaderHome navigation={navigation} currentScreen="일정" />
        ),
      })}>
      <Stack.Screen name="일정" component={ScheduleScreen} />
      <Stack.Screen
        name="알림화면"
        component={NotificationScreen}
        options={({navigation}) => ({
          gestureEnabled: true, // ← ✅ 이거 true로 되어 있어야 슬라이드 백 가능!
          headerRight: () => null,

          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
          headerTitle: '',
        })}
      />

      <Stack.Screen
        name="설정화면"
        component={SettingScreen}
        options={({navigation}) => ({
          gestureEnabled: true, // ← ✅ 이거 true로 되어 있어야 슬라이드 백 가능!
          headerRight: () => null,

          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
          headerTitle: '',
        })}
      />
      <Stack.Screen
        name="알림설정화면"
        component={NotificationSettingScreen}
        options={({navigation}) => ({
          gestureEnabled: true, // ← ✅ 이거 true로 되어 있어야 슬라이드 백 가능!
          headerRight: () => null,

          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
          headerTitle: '',
        })}
      />
    </Stack.Navigator>
  );
}
