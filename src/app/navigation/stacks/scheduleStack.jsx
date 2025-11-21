import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import ScheduleScreen from '../../../features/schedule/screens';
import {Text, Platform} from 'react-native';
import {
  getResponsiveWidth,
  getResponsiveHeight,
} from '../../../utils/responsive';
import {
  RenderHeaderHome,
  RenderGoBackButton,
} from '../helpers/tabHeaderHelpers';
import SettingScreen from '../../../features/setting/screens/SettingScreen';
import NotificationScreen from '../../../features/NotificationScreen';
import NotificationSettingScreen from '../../../features/setting/screens/NotificationSettingScreen';
import {HEADER_STYLES} from 'styles/style';

const Stack = createStackNavigator();

export default function ScheduleStack() {
  return (
    <Stack.Navigator
      initialRouteName="일정"
      screenOptions={({navigation}) => ({
        gestureEnabled: true,
        headerShown: true,
        headerStyle: {
          borderBottomWidth: 0,
          shadowOpacity: 0,
          elevation: 0,
          height:
            Platform.OS === 'ios'
              ? getResponsiveHeight(107.5)
              : getResponsiveHeight(80),
        },
        headerTitleAlign: 'left',
        headerLeft: () => null,
        headerTitle: () => (
          <Text
            style={{
              fontFamily: HEADER_STYLES.mainTitleFontFamily,
              fontWeight: HEADER_STYLES.mainTitleFontWeight,
              fontSize: HEADER_STYLES.mainTitleFontSize, // ✅ 24 → 16 (다른 앱이랑 비슷한 크기)
              color: 'black',
              lineHeight: HEADER_STYLES.mainTitleLineHeight, // ✅ 너무 크지 않게 살짝만
              textAlignVertical: 'center',
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
          gestureEnabled: true,
          headerRight: () => null,
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
          headerTitle: '',
        })}
      />

      <Stack.Screen
        name="설정화면"
        component={SettingScreen}
        options={({navigation}) => ({
          gestureEnabled: true,
          headerRight: () => null,
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
          headerTitle: '',
        })}
      />

      <Stack.Screen
        name="알림설정화면"
        component={NotificationSettingScreen}
        options={({navigation}) => ({
          gestureEnabled: true,
          headerRight: () => null,
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
          headerTitle: '',
        })}
      />
    </Stack.Navigator>
  );
}
