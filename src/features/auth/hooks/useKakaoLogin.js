// src/hooks/auth/useKakaoLogin.js

import * as KakaoLogin from '@react-native-seoul/kakao-login';
import {useCallback} from 'react';
import {useDispatch} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {loginThunk} from '../store/loginThunk';
import { setHasFamily} from 'utils/storage';
import {fetchUserThunk} from 'features/home/store/userThunk';
import {fetchFamilyThunk} from 'features/home/store/familyThunk';

// 🔹 실제 프로젝트의 store 경로에 맞게 유지
import store from 'store/store';

export function useKakaoLogin() {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const login = useCallback(async () => {
    try {
      const result = await KakaoLogin.login();
      console.log('✅ Login Success:', result);

      // 1) 백엔드 로그인
      await dispatch(loginThunk(result.accessToken));

      // 2) 내 유저 정보 불러오기
      await dispatch(fetchUserThunk());

      // 3) 갱신된 user 정보를 store에서 읽기
      const state = store.getState();
      const user = state.user;          // <- 실제 slice 구조에 따라 user.user 일 수도 있음
      const familyId = user?.familyId;

      console.log('👤 store에서 읽은 user:', user);
      console.log('👨‍👩‍👧‍👦 familyId:', familyId);

      // 5) hasFamily 상태 저장 및 가족 정보 조회
      const hasFamily = !!familyId;

      await setHasFamily(hasFamily);

      if (hasFamily && familyId) {
        await dispatch(fetchFamilyThunk(familyId));
      } else {
        console.log('⚠️ familyId 없음, fetchFamilyThunk 스킵');
      }

      // 6) familyId 여부에 따라 네비게이션 분기
      if (hasFamily) {
        // 가족 존재 → Tabs 안의 Home으로
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'Tabs',
              params: {
                // Tabs 내에서 home 탭 이름에 맞게 수정 필요
                screen: 'Home',
              },
            },
          ],
        });
      } else {
        // 가족 없음 → 약관동의화면으로
        navigation.reset({
          index: 0,
          routes: [{name: '약관동의화면'}], // 실제 등록된 route name 확인
        });
      }
    } catch (error) {
      console.log('❌ 카카오 로그인 또는 사용자/가족 정보 조회 실패:', error);

      if (error?.code === 'E_CANCELLED_OPERATION') {
        console.log('🚫 카카오 로그인 취소:', error.message);
      }
      // 여기서 토스트 띄우는 로직 추가 가능
    }
  }, [dispatch, navigation]);

  return {login};
}
