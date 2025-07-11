import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import ScheduleScreen from '../../screens/schedule';
import {Image, View, Text} from 'react-native';
import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveFontSize,
} from '../../utils/responsive';

const Stack = createStackNavigator();

export default function ScheduleStack() {
  return (
    <Stack.Navigator
      initialRouteName="일정"
      screenOptions={({navigation}) => ({
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
        headerTitle: () => (
          <Text
            style={{
              fontFamily: 'Pretendard-Bold',
              fontSize: getResponsiveFontSize(22.5),
              color: '#4D4D4D',
            }}>
            일정
          </Text>
        ),
        headerTitleContainerStyle: {
          paddingLeft: getResponsiveWidth(15),
        },
      })}>
      <Stack.Screen name="일정" component={ScheduleScreen} />
    </Stack.Navigator>
  );
}
