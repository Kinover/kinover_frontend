import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useCallback, useLayoutEffect} from 'react';
import {Platform} from 'react-native';
import {
  getResponsiveIconSize,
  getResponsiveWidth,
  getResponsiveHeight,
} from '../../utils/responsive';

// ✅ TabNavigator를 찾는 유틸
function findTabNavigator(nav) {
  let currentNav = nav;
  for (let i = 0; i < 5; i++) {
    if (!currentNav?.getParent) break;
    const parent = currentNav.getParent();
    if (parent?.setOptions) return parent;
    currentNav = parent;
  }
  return null;
}

// ✅ 옵션을 받는 커스텀 훅
export default function useHideTabBar({stayHidden = false} = {}) {
  const navigation = useNavigation();

  useLayoutEffect(
    useCallback(() => {
      const tabNavigation = findTabNavigator(navigation);

      if (!tabNavigation) {
        console.warn('⚠️ TabNavigator 탐색 실패!');
        return;
      }

      // 탭바 숨김
      tabNavigation.setOptions({
        tabBarStyle: {
          display: 'none',
        },
      });

      return () => {
        // 🟡 조건에 따라 복원 여부 결정
        if (!stayHidden) {
          tabNavigation.setOptions({
            tabBarStyle: {
              backgroundColor: 'white',
              borderTopColor: '#F9F9F9',
              borderTopLeftRadius: getResponsiveIconSize(15),
              borderTopRightRadius: getResponsiveIconSize(15),
              paddingTop: 8,
              paddingHorizontal: getResponsiveWidth(15),
              height: getResponsiveHeight(90),
            },
          });
        }
      };
    }, [navigation, stayHidden]),
  );
}
