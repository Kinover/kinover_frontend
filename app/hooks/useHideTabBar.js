import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { Platform } from 'react-native';

// ✅ TabNavigator를 확실하게 탐색하는 유틸
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

export default function useHideTabBar() {
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      const tabNavigation = findTabNavigator(navigation);

      // ✅ 탭바 숨김
      tabNavigation?.setOptions({
        tabBarStyle: { display: 'none' },
      });

      return () => {
        // ✅ 탭바 복원
        tabNavigation?.setOptions({
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 0.5,
            borderTopColor: '#eee',
            paddingBottom: Platform.OS === 'ios' ? 20 : 10,
            paddingTop: 8,
            height: Platform.OS === 'ios' ? 90 : 90,
          },
        });
      };
    }, [navigation])
  );
}
