/**
 * @fileoverview 루트 네비게이터 컴포넌트
 * 
 * 앱의 메인 네비게이션 스택을 관리합니다.
 * 탭 네비게이터와 전역 화면(설정, 알림 등)을 포함합니다.
 */

import React from 'react';
import {View} from 'react-native';
import {createStackNavigator} from '@react-navigation/stack';

import TabNavigator from './tabNavigator';
import {
  GuideOverlayProvider,
  TabsWithOptionalGuideHost,
} from 'contexts/GuideOverlayContext';
import SettingScreen from 'features/setting/screens/SettingScreen';
import NotificationSettingScreen from 'features/setting/screens/NotificationSettingScreen';
import BlockedUsersScreen from 'features/setting/screens/BlockedUsersScreen';
import NotificationScreen from 'features/notification/screens/NotificationScreen';
import {RenderHeaderBackButton} from './helpers/tabHeaderHelpers';
import {getResponsiveHeight} from 'utils/responsive';

// ==================== Constants ====================

const Stack = createStackNavigator();

/** 가이드 없을 땐 탭만 렌더(자식 1개) → 탭바 히트 영역 꼬임 방지. 가이드 있을 때만 Host 추가 */
function TabsWithGuideOverlay(props) {
  return (
    <GuideOverlayProvider>
      <View style={{flex: 1}} pointerEvents="box-none">
        <TabsWithOptionalGuideHost
          TabNavigatorComponent={TabNavigator}
          tabNavigatorProps={props}
        />
      </View>
    </GuideOverlayProvider>
  );
}

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
      {/* 메인 탭 네비게이터 + iOS 가이드 오버레이 호스트 */}
      <Stack.Screen name="Tabs" component={TabsWithGuideOverlay} />

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
        name="차단계정화면"
        component={BlockedUsersScreen}
        options={({navigation, route}) => ({
          ...createHeaderOptions(navigation, route),
          headerTitle: '신고 및 차단',
        })}
      />

      <Stack.Screen
        name="알림화면"
        component={NotificationScreen}
        options={createHeaderOptions}
      />
    </Stack.Navigator>
  );
}
