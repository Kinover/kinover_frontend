/**
 * @fileoverview 인증 네비게이터 컴포넌트
 * 
 * 회원가입 및 로그인 플로우를 관리하는 네비게이터입니다.
 * 온보딩 → 약관동의 → 전화번호 인증 → 가족 설정 → 설정 완료(홈) 순으로 진행됩니다.
 */

import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

import {stackCardScreenOption} from './navigationTheme';

import OnboardingScreen from 'features/onboarding/screens/OnboardingScreen';
import FamilySetupScreen from 'features/auth/screens/FamilySetupScreen';
import SetupFinishScreen from 'features/auth/screens/SetupFinishScreen';
import TermsAgreementScreen from 'features/auth/screens/TermsAgreementScreen';
import PhoneVerificationScreen from 'features/auth/screens/PhoneVerificationScreen';

// ==================== Constants ====================

const AuthStack = createStackNavigator();

// ==================== Main Component ====================

/**
 * 인증 네비게이터 메인 컴포넌트
 * @param {Object} props - 컴포넌트 props
 * @param {string} props.initialRouteName - 초기 라우트 이름
 * @returns {JSX.Element} 인증 네비게이터 컴포넌트
 */
export default function AuthNavigator({initialRouteName = '온보딩화면'}) {
  return (
    <AuthStack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{headerShown: false, ...stackCardScreenOption}}>
      <AuthStack.Screen name="온보딩화면" component={OnboardingScreen} />
      <AuthStack.Screen name="약관동의화면" component={TermsAgreementScreen} />
      <AuthStack.Screen name="전화번호인증화면" component={PhoneVerificationScreen} />
      <AuthStack.Screen name="가족설정화면" component={FamilySetupScreen} />
      <AuthStack.Screen name="설정완료화면" component={SetupFinishScreen} />
    </AuthStack.Navigator>
  );
}
