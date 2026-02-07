// src/navigation/authNavigator.jsx
import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

// import OnboardingScreen from 'features/onboarding/screens/OnboardingScreen';
import FamilySetupScreen from 'features/auth/screens/FamilySetupScreen';
import UserSetupScreen from 'features/auth/screens/UserSetupScreen';
import SetupFinishScreen from 'features/auth/screens/SetupFinishScreen';
import TermsAgreementScreen from 'features/auth/screens/TermsAgreementScreen';
import OnboardingScreen from 'features/onboarding/screens/OnboardingScreen';

const AuthStack = createStackNavigator();

export default function AuthNavigator({initialRouteName = '온보딩화면'}) {
  return (
    <AuthStack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{headerShown: false}}>
      <AuthStack.Screen name="온보딩화면" component={OnboardingScreen} />
      <AuthStack.Screen name="약관동의화면" component={TermsAgreementScreen} />
      <AuthStack.Screen name="유저정보세팅화면" component={UserSetupScreen} />
      <AuthStack.Screen name="가족설정화면" component={FamilySetupScreen} />
      <AuthStack.Screen name="설정완료화면" component={SetupFinishScreen} />
    </AuthStack.Navigator>
  );
}
