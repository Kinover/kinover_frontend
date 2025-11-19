// 예: src/hooks/auth/useAutoLogin.js

import {useEffect} from 'react';
import {useDispatch} from 'react-redux';
import {getHasFamily, getToken} from '../../../utils/storage';
import { setLoginSuccess } from '../store/authSlice';
import { fetchUserThunk } from 'features/home/store/userThunk';
import { fetchFamilyThunk } from 'features/home/store/familyThunk';
// 가족 ID는 필요하면 파라미터로 바꿔도 됨
const FAMILY_ID = '0e992098-1544-11f0-be5c-0a1e787a0cd7';

export function useAutoLogin(navigateToHome) {
  const dispatch = useDispatch();

  useEffect(() => {
    const run = async () => {
      try {
        const token = await getToken();
        const hasFamily = await getHasFamily();
        console.log('🔐 자동 로그인 - 토큰:', token);
        console.log('👨‍👩‍👧 hasFamily:', hasFamily);

        if (token && hasFamily) {
          dispatch(setLoginSuccess());
          await dispatch(fetchUserThunk());
          await dispatch(fetchFamilyThunk(FAMILY_ID));
          navigateToHome();
        }
      } catch (err) {
        console.error('🚨 자동 로그인 실패:', err);
      }
    };

    run();
  }, [dispatch, navigateToHome]);
}
