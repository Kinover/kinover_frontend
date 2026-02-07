// src/features/auth/hooks/useAppleLogin.js
import {useCallback} from 'react';
import {Platform} from 'react-native';
import {appleAuth} from '@invertase/react-native-apple-authentication';
import {useDispatch} from 'react-redux';

import { apiClient } from 'utils/apiClient';
// ✅ 너희 axios 인스턴스가 다른 경로면 그걸로 바꿔
// (예: apiClient, axiosInstance 등)

import {
  setLoginError,
  setLoginLoading,
  setLoginSuccess,
} from '../store/loginSlice';

// ✅ 너희 프로젝트에서 토큰/hasFamily 저장 유틸 이름이 다르면
// useKakaoLogin에서 쓰는 함수 이름 그대로 맞춰줘.
import {saveToken, setHasFamily} from 'utils/storage';

export function useAppleLogin() {
  const dispatch = useDispatch();

  const login = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      dispatch(setLoginError('애플 로그인은 iOS에서만 지원돼요.'));
      return;
    }

    dispatch(setLoginLoading(true));
    dispatch(setLoginError(null));

    try {
      // ✅ 애플 로그인 요청
      const res = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      const identityToken = res?.identityToken;

      if (!identityToken) {
        throw new Error(
          'identityToken이 없습니다. (실기기/Sign In with Apple Capability/Developer 설정 확인 필요)',
        );
      }

      // ✅ 서버로 전달 (백엔드가 검증 + 가입/로그인 + JWT 발급)
      const serverRes = await apiClient.post('/api/login/apple', {identityToken});
      const {token, hasFamily} = serverRes.data || {};

      if (!token) throw new Error('서버 토큰이 없습니다.');

      // ✅ 저장
      await saveToken(token);
      await setHasFamily(!!hasFamily);

      // ✅ Redux 반영 (카카오랑 동일하게)
      dispatch(setLoginSuccess({token, hasFamily: !!hasFamily}));
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data ||
        e?.message ||
        '애플 로그인 중 오류가 발생했어요.';
      dispatch(setLoginError(String(msg)));
    } finally {
      dispatch(setLoginLoading(false));
    }
  }, [dispatch]);

  return {login};
}
