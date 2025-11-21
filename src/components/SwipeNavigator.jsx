// src/components/common/SwipeNavigator.js  (경로는 네 프로젝트 구조대로)

// ✅ Reanimated 제거 버전

import React from 'react';
import {View} from 'react-native';
import {
  PanGestureHandler,
  State,
} from 'react-native-gesture-handler';
import {useNavigation} from '@react-navigation/native';

export default function SwipeNavigator({
  children,
  // 같은 네비게이터(스택) 안에서 화면 이동
  leftTo = null,   // 왼쪽 → 오른쪽 스와이프 시 이동할 screen name
  rightTo = null,  // 오른쪽 → 왼쪽 스와이프 시 이동할 screen name

  // 탭 이동용
  leftTab = null,  // 왼쪽 → 오른쪽 스와이프 시 이동할 탭 이름 (예: '홈')
  rightTab = null, // 오른쪽 → 왼쪽 스와이프 시 이동할 탭 이름 (예: '소통')

  threshold = 80,  // 스와이프 민감도
}) {
  const navigation = useNavigation();

  const handleStateChange = ({nativeEvent}) => {
    if (nativeEvent.state !== State.END) return;

    const {translationX} = nativeEvent;
    const parentNav = navigation.getParent?.();

    // 👉 오른쪽 → 왼쪽
    if (translationX < -threshold) {
      if (rightTab && parentNav) {
        parentNav.navigate(rightTab);      // 탭 변경
      } else if (rightTo) {
        navigation.navigate(rightTo);      // 같은 스택 내 화면 이동
      }
      return;
    }

    // 👈 왼쪽 → 오른쪽
    if (translationX > threshold) {
      if (leftTab && parentNav) {
        parentNav.navigate(leftTab);
      } else if (leftTo) {
        navigation.navigate(leftTo);
      }
    }
  };

  return (
    <PanGestureHandler onHandlerStateChange={handleStateChange}>
      <View style={{flex: 1}}>
        {children}
      </View>
    </PanGestureHandler>
  );
}
