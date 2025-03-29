import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

// 인증 관련 스크린 import
import OnboardingScreen from '../screens/authentication/onboardingScreen';
import FamilySetupScreen from '../screens/family/familySetupScreen';
import FamilySetupFinishScreen from '../screens/family/familySetupFinishScreen';
import CreateFamilyScreen from '../screens/family/createFamilyScreen';

const AuthStack = createStackNavigator();

export default function AuthNavigator() {
  return (
    <AuthStack.Navigator initialRouteName="온보딩화면" screenOptions={{headerShown: false}}>
      <AuthStack.Screen name="온보딩화면" component={OnboardingScreen} />
      <AuthStack.Screen name="가족설정화면" component={FamilySetupScreen} />
      <AuthStack.Screen name="가족설정완료화면" component={FamilySetupFinishScreen} />
      <AuthStack.Screen name="가족생성화면" component={CreateFamilyScreen} />
    </AuthStack.Navigator>
  );
}
