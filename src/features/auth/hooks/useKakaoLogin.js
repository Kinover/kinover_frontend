// 예: src/hooks/auth/useKakaoLogin.js

import * as KakaoLogin from '@react-native-seoul/kakao-login';
import {useCallback} from 'react';
import {useDispatch} from 'react-redux';
import {loginThunk} from '../store/loginThunk';
import {saveLoginInfo} from '../../../utils/storage';
import {fetchUserThunk} from 'features/home/store/userThunk';
import {fetchFamilyThunk} from 'features/home/store/familyThunk';

const FAMILY_ID = '0e992098-1544-11f0-be5c-0a1e787a0cd7';

export function useKakaoLogin(navigateToHome) {
  const dispatch = useDispatch();

  const login = useCallback(async () => {
    try {
      const result = await KakaoLogin.login();
      console.log('✅ Login Success:', result);

      await saveLoginInfo({
        token: result.accessToken,
        hasFamily: true,
      });

      await dispatch(loginThunk(result.accessToken));
      await dispatch(fetchUserThunk());
      await dispatch(fetchFamilyThunk(FAMILY_ID));
      navigateToHome();
    } catch (error) {
      if (error.code === 'E_CANCELLED_OPERATION') {
        console.log('🚫 카카오 로그인 취소:', error.message);
      } else {
        console.log(
          `❌ 카카오 로그인 실패 (code:${error.code})`,
          error.message,
        );
      }
    }
  }, [dispatch, navigateToHome]);

  return {login};
}
