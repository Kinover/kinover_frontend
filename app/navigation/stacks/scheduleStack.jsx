import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import ScheduleScreen from '../../screens/schedule';
import {Image,View} from 'react-native';
import {getResponsiveWidth, getResponsiveHeight} from '../../utils/responsive';


const Stack = createStackNavigator();

export default function ScheduleStack() {
  return (
    <Stack.Navigator
      initialRouteName="일정화면"
      screenOptions={({navigation}) => ({
        // ✅ 객체 구조분해 필수!
        headerStyle: {
          borderBottomWidth: 0,
          shadowOpacity: 0,
          elevation: 0,
          height:
          Platform.OS == 'ios'
            ? getResponsiveHeight(120)
            : getResponsiveHeight(80),        },
        headerTitleAlign: 'center',
        headerShown: true,
        headerTitle: () => (
          <View style={{paddingBottom: getResponsiveHeight(10)}}>
            <Image
              source={require('../../assets/images/kinover.png')}
              style={{
                width: getResponsiveWidth(49),
                height: getResponsiveHeight(46),
                resizeMode: 'contain',
              }}
            />
          </View>
        ),
        headerLeft: () => null, // ✅ 올바른 접근
      })}>
      <Stack.Screen name="일정화면" component={ScheduleScreen} />
    </Stack.Navigator>
  );
}
