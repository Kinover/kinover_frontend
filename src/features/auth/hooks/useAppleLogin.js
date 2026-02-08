// src/features/auth/hooks/useAppleLogin.js
import {useCallback, useRef} from 'react';
import {Platform, Alert} from 'react-native';
import {appleAuth} from '@invertase/react-native-apple-authentication';
import {useDispatch} from 'react-redux';

import {appleLoginThunk} from '../store/loginThunk';
import {startChatSocket, stopChatSocket} from 'features/chat/hooks/ChatSocket';

import {
  setLoginError,
  setLoginLoading,
  setAuthChecked,
  setLoginSuccess,
  setLogout,
} from '../store/loginSlice';

import {deleteLoginInfo} from 'utils/storage';

const withTimeout = (promise, ms = 8000) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`timeout ${ms}ms`)), ms),
    ),
  ]);

export function useAppleLogin() {
  const dispatch = useDispatch();
  const socketUnsubRef = useRef(null);

  const login = useCallback(async () => {
    // ✅ iOS만
    if (Platform.OS !== 'ios') {
      const msg = '애플 로그인은 iOS에서만 지원돼요.';
      dispatch(setLoginError(msg));
      Alert.alert('애플 로그인', msg);
      return;
    }

    // ✅ 지원 여부 체크
    const supported = appleAuth.isSupported;
    if (!supported) {
      const msg =
        '이 기기/환경에서는 애플 로그인을 지원하지 않아요. (시뮬레이터/Capability/서명 설정 확인)';
      dispatch(setLoginError(msg));
      Alert.alert('애플 로그인', msg);
      return;
    }

    dispatch(setLoginLoading(true));
    dispatch(setLoginError(null));

    try {
      console.log('🍎 Apple login pressed');

      // ✅ 1) 애플 로그인 요청
      const res = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      console.log('🍎 Apple performRequest result:', res);

      const identityToken = res?.identityToken;
      if (!identityToken) {
        throw new Error(
          'identityToken이 없습니다. (실기기/Sign In with Apple Capability/서명 설정 확인 필요)',
        );
      }

      // ✅ 2) 서버 로그인은 thunk에서 처리 (카카오랑 동일)
      const r = dispatch(appleLoginThunk(identityToken));
      const loginResult =
        typeof r?.unwrap === 'function'
          ? await withTimeout(r.unwrap(), 12000)
          : await withTimeout(r, 12000);

      // ✅ 3) 카카오 흐름이랑 동일하게 “로그인 성공 확정” 한 번 더 박아도 됨(중복이어도 안전)
      dispatch(setLoginSuccess());

      // ✅ 4) 소켓은 가족 있을 때만
      const hasFamily = !!loginResult?.hasFamily;
      if (hasFamily && !socketUnsubRef.current) {
        socketUnsubRef.current = startChatSocket(dispatch);
      }

      // ✅ 5) 마지막에 authChecked true
      dispatch(setAuthChecked(true));

      console.log('🍎 Apple login success:', {
        hasFamily,
        familyId: loginResult?.familyId ?? null,
      });
    } catch (e) {
      console.log('❌ Apple login fail:', e);

      try {
        await deleteLoginInfo();
      } catch {
        null;
      }

      try {
        stopChatSocket();
      } catch {
        null;
      }

      dispatch(setLogout());
      dispatch(setLoginError(e?.message ?? '애플 로그인 실패'));
      dispatch(setAuthChecked(true));

      Alert.alert('애플 로그인 실패', e?.message ?? '애플 로그인 실패');
    } finally {
      dispatch(setLoginLoading(false));
    }
  }, [dispatch]);

  return {login};
}
