import React, {useState} from 'react';
import {View, Image} from 'react-native';
import {getResponsiveHeight, getResponsiveWidth} from '../utils/responsive';
import {createStackNavigator} from '@react-navigation/stack';
import TabNavigator from './tabNavigator';
import AuthNavigator from './authNavigator';

const AppStack = createStackNavigator();

export default function AppNavigator({}) {
  return (
    <AppStack.Navigator
      initialRouteName="Auth"
      screenOptions={({navigation}) => ({
        headerBackTitleVisible: false,
        // ✅ 객체 구조분해 필수!
        headerStyle: {
          borderBottomWidth: 0,
          shadowOpacity: 0,
          elevation: 0,
          height: getResponsiveHeight(120),
          display: 'flex',
        },
        headerTitleAlign: 'center',
        headerShown: false,
        headerBackTitle: '', // ✅ iOS에서 <Auth 같은 텍스트 제거
        headerTitle: () => (
          <View style={{paddingBottom: getResponsiveHeight(10)}}>
            <Image
              source={require('../assets/images/kinover.png')}
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
      {/* 인증 흐름 */}
      <AppStack.Screen
        name="Auth"
        component={AuthNavigator}
        options={{
          headerShown: false,
          headerBackTitle: '', // ✅ iOS에서 <Auth 같은 텍스트 제거
          headerBackTitleVisible: false,
        }}
      />

      {/* 메인 탭 */}
      <AppStack.Screen
        name="Tabs"
        component={TabNavigator}
        options={{
          headerBackTitleVisible: false,
          headerBackTitle: '', // ✅ iOS에서 <Auth 같은 텍스트 제거
        }}
      />
    </AppStack.Navigator>
  );
}
