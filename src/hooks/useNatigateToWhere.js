// src/hooks/navigation/useNavigateToWhere.js
import {useCallback} from 'react';
import {useNavigation} from '@react-navigation/native';

export function useNavigateToWhere() {
  const navigation = useNavigation();

  const navigateToWhere = useCallback(
    ({root, tab, screen, params} = {}) => {
      if (!root) {
        console.warn('useNavigateToWhere: root 이름은 필수입니다.');
        return;
      }

      // 최종적으로 reset에 넣을 route 객체
      let rootRoute = {name: root};

      // Tabs 같은 상위 네비 안에 탭/스크린이 있는 경우
      if (tab) {
        rootRoute.state = {
          routes: [
            {
              name: tab,
              ...(screen && {
                state: {
                  routes: [{name: screen, params}],
                },
              }),
            },
          ],
        };
      } else if (screen) {
        // root 스택 안에 바로 screen 이 있는 경우
        rootRoute.state = {
          routes: [{name: screen, params}],
        };
      }

      navigation.reset({
        index: 0,
        routes: [rootRoute],
      });
    },
    [navigation],
  );

  return navigateToWhere;
}
