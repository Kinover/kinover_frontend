import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import ScheduleScreen from 'features/schedule/screens';
import AppText from 'components/AppText';
import {getTabStackHeaderHeight} from 'utils/layoutMetrics';
import {stackCardScreenOption} from '../navigationTheme';
import {
  RenderHeaderHome,
} from '../helpers/tabHeaderHelpers';
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
          height: getTabStackHeaderHeight(),
        },
        headerTitleAlign: 'left',
        ...stackCardScreenOption,
        headerLeft: () => null,
        headerTitle: () => (
          <AppText
            allowFontScaling={false}
            style={{
              fontFamily: HEADER_STYLES().mainTitleFontFamily,
              fontWeight: HEADER_STYLES().mainTitleFontWeight,
              fontSize: HEADER_STYLES().mainTitleFontSize, // 24 → 16 (다른 앱이랑 비슷한 크기)
              color: 'black',
              lineHeight: HEADER_STYLES().mainTitleLineHeight, // 너무 크지 않게 살짝만
              textAlignVertical: 'center',
            }}>
            일정
          </AppText>
        ),
 // headerTitleContainerStyle: {
 // paddingLeft: getResponsiveWidth(6),
 // },
        headerRight: () => (
          <RenderHeaderHome navigation={navigation} currentScreen="일정" />
        ),
      })}>
      <Stack.Screen name="일정" component={ScheduleScreen} />

     
    </Stack.Navigator>
  );
}
