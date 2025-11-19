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
    // navigation.reset({
    //   routes: [
    //     {
    //       name: 'Auth',
    //       state: {
    //         routes: [{name: '유저정보세팅화면', state: {routes: [{name: '유저정보세팅화면'}]}}],
    //       },
    //     },
    //   ],
    // });
  }, [navigation]);

  return navigateToHome;
}
