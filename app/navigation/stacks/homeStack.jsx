import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import HomeScreen from '../../screens/home';
import GradeScreen from '../../screens/home/gradeScreen';
import FamilySettingScreen from '../../screens/home/familySettingScreen';
import NotificationScreen from '../../components/notificationScreen';
import {RenderHeaderLeft1} from '../tabHeaderHelpers';
import {RenderHeaderRightHome} from '../tabHeaderHelpers';
import {RenderGoBackButton} from '../tabHeaderHelpers';
import {Image, View} from 'react-native';
import {getResponsiveWidth, getResponsiveHeight} from '../../utils/responsive';


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
          height: getResponsiveHeight(120),
          overflow: 'visible',
        },
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
      })}>
      <Stack.Screen
        name="감정화면"
        component={HomeScreen}
        options={({navigation}) => ({
          headerLeft: () => <RenderHeaderLeft1 navigation={navigation} />,
          headerRight: () => <RenderHeaderRightHome navigation={navigation} />,
          headerTitle: () => (
            <Image
              source={require('../../assets/images/kinover.png')}
              style={{
                width: getResponsiveWidth(49),
                height: getResponsiveHeight(46),
                marginBottom: getResponsiveHeight(10),
                resizeMode: 'contain',
              }}
            />
          ),
        })}
      />
      <Stack.Screen
        name="등급화면"
        component={GradeScreen}
        options={({navigation}) => ({
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
          headerTitle: '',
        })}
      />
      <Stack.Screen
        name="가족설정화면"
        component={FamilySettingScreen}
        options={({navigation}) => ({
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
        })}
      />
      <Stack.Screen
        name="알림화면"
        component={NotificationScreen}
        options={({navigation}) => ({
          headerLeft: () => <RenderGoBackButton navigation={navigation} />,
        })}
      />
    </Stack.Navigator>
  );
}
