/**
 * @fileoverview 루트 네비게이터 컴포넌트
 * 
 * 앱의 메인 네비게이션 스택을 관리합니다.
 * 탭 네비게이터와 전역 화면(설정, 알림 등)을 포함합니다.
 */

import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

import TabNavigator from './TabNavigator';
import SettingScreen from 'features/setting/screens/SettingScreen';
import NotificationSettingScreen from 'features/setting/screens/NotificationSettingScreen';
import NotificationScreen from 'features/notification/screens/NotificationScreen';
import {RenderHeaderBackButton} from './helpers/tabHeaderHelpers';
import {getResponsiveHeight} from 'utils/responsive';

// ==================== Constants ====================

const Stack = createStackNavigator();

/**
 * 공통 헤더 옵션 생성 함수
 * @param {Object} navigation - 네비게이션 객체
 * @param {Object} route - 라우트 객체
 * @returns {Object} 헤더 옵션 객체
 */
const createHeaderOptions = (navigation, route) => ({
  headerShown: true,
  headerStyle: {
    height: getResponsiveHeight(107.5),
    shadowColor: 'transparent',
    elevation: 0,
    borderBottomWidth: 0,
  },
  headerTitle: '',
  headerLeft: () => (
    <RenderHeaderBackButton navigation={navigation} route={route} />
  ),
});

// ==================== Main Component ====================

/**
 * 루트 네비게이터 메인 컴포넌트
 * @param {Object} props - 컴포넌트 props
 * @param {string} props.initialRouteName - 초기 라우트 이름
 * @returns {JSX.Element} 루트 네비게이터 컴포넌트
 */
export default function RootNavigator({initialRouteName = 'Tabs'}) {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        // 설정/알림 갔다 와도 Tabs 언마운트 안 하게 → goBack() 시 탭 상태 유지
        detachInactiveScreens: false,
      }}>
      {/* 메인 탭 네비게이터 */}
      <Stack.Screen name="Tabs" component={TabNavigator} />

      {/* 전역 화면들 */}
      <Stack.Screen
        name="설정화면"
        component={SettingScreen}
        options={createHeaderOptions}
      />

      <Stack.Screen
        name="알림설정화면"
        component={NotificationSettingScreen}
        options={createHeaderOptions}
      />

      <Stack.Screen
        name="알림화면"
        component={NotificationScreen}
        options={createHeaderOptions}
      />
    </Stack.Navigator>
  );
}
