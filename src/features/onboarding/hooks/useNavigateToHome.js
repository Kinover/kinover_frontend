import {useCallback} from 'react';
import {useNavigation} from '@react-navigation/native';

export function useNavigateToHome() {
  const navigation = useNavigation();

  const navigateToHome = useCallback(
    (familyId) => {
      if (familyId) {
        // 가족 존재 → Tabs 로 보내고 기본 탭을 Home으로 고정
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'Tabs',
              params: {
                screen: '홈화면', // ← Home 탭으로 강제로 이동
              },
            },
          ],
        });
      } else {
        // 가족 없음 → Auth Stack의 약관동의화면으로 이동
        navigation.reset({
          index: 0,
          routes: [{name: '약관동의화면'}],
        });
      }
    },
    [navigation],
  );

  return navigateToHome;
}
