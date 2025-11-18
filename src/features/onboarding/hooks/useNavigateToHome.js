// 예: src/hooks/navigation/useNavigateToHome.js

import {useCallback} from 'react';
import {useNavigation} from '@react-navigation/native';

export function useNavigateToHome() {
  const navigation = useNavigation();

  const navigateToHome = useCallback(() => {
    navigation.reset({
      routes: [
        {
          name: 'Tabs',
          state: {
            routes: [{name: '홈', state: {routes: [{name: '홈'}]}}],
          },
        },
      ],
    });
  }, [navigation]);

  return navigateToHome;
}
