import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

// 인증 관련 스크린 import
import OnboardingScreen from '../../features/onboarding/screens/onboardingScreen';
import FamilySetupScreen from '../../features/family/familySetupScreen';
import FamilySetupFinishScreen from '../../features/family/familySetupFinishScreen';
import CreateFamilyScreen from '../../features/family/createFamilyScreen';

const AuthStack = createStackNavigator();

export default function AuthNavigator() {
  return (
    <AuthStack.Navigator
      initialRouteName="온보딩화면"
      screenOptions={{headerShown: false}}>
      <AuthStack.Screen name="온보딩화면" component={OnboardingScreen} />
      <AuthStack.Screen name="가족설정화면" component={FamilySetupScreen} />
      <AuthStack.Screen
        name="가족설정완료화면"
        component={FamilySetupFinishScreen}
      />
      <AuthStack.Screen name="가족생성화면" component={CreateFamilyScreen} />
    </AuthStack.Navigator>
  );
}
