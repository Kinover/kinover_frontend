import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

// 인증 관련 스크린 import
import OnboardingScreen from '../../features/onboarding/screens/OnboardingScreen';
import FamilySetupScreen from '../../features/auth/screens/FamilySetupScreen';
import CreateFamilyScreen from 'features/family/CreateFamilyScreen';
import UserSetupScreen from 'features/auth/screens/UserSetupScreen';
import SetupFinishScreen from '../../features/auth/screens/SetupFinishScreen';
import TermsAgreementScreen from 'features/auth/screens/TermsAgreementScreen';
const AuthStack = createStackNavigator();

export default function AuthNavigator() {
  return (
    <AuthStack.Navigator
      initialRouteName="온보딩화면"
      screenOptions={{headerShown: false}}>
      <AuthStack.Screen name="온보딩화면" component={OnboardingScreen} />

      <AuthStack.Screen name="약관동의화면" component={TermsAgreementScreen} />
      <AuthStack.Screen name="유저정보세팅화면" component={UserSetupScreen} />

      <AuthStack.Screen name="가족설정화면" component={FamilySetupScreen} />
      <AuthStack.Screen name="설정완료화면" component={SetupFinishScreen} />
      <AuthStack.Screen name="가족생성화면" component={CreateFamilyScreen} />
    </AuthStack.Navigator>
  );
}
