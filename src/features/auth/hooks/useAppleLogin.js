// src/features/auth/hooks/useAppleLogin.js
import {useCallback, useRef} from 'react';
import {Platform, Alert} from 'react-native';
import {appleAuth} from '@invertase/react-native-apple-authentication';
import {useDispatch, useStore} from 'react-redux';

import {appleLoginThunk} from '../store/loginThunk';
import {startChatSocket, stopChatSocket} from 'features/chat/hooks/ChatSocket';

import {
  setLoginError,
  setLoginLoading,
  setAuthChecked,
  setLogout,
  setPhoneVerificationPending,
} from '../store/loginSlice';

import {deleteLoginInfo, setStoredPhoneVerificationPending} from 'utils/storage';

export function useAppleLogin() {
  const dispatch = useDispatch();
  const store = useStore();
  const socketUnsubRef = useRef(null);
  const inFlightRef = useRef(false);

  const login = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
 // iOS만
    if (Platform.OS !== 'ios') {
      const msg = '애플 로그인은 iOS에서만 지원돼요.';
      dispatch(setLoginError(msg));
      Alert.alert('애플 로그인', msg);
      inFlightRef.current = false;
      return;
    }

 // 지원 여부 체크
    const supported = appleAuth.isSupported;
    if (!supported) {
      const msg =
        '이 기기/환경에서는 애플 로그인을 지원하지 않아요. (시뮬레이터/Capability/서명 설정 확인)';
      dispatch(setLoginError(msg));
      Alert.alert('애플 로그인', msg);
      inFlightRef.current = false;
      return;
    }

    dispatch(setLoginLoading(true));
    dispatch(setLoginError(null));
    let loginConfirmed = false;

    try {

 // 1) 애플 로그인 요청
      const res = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });


      const identityToken = res?.identityToken;
      if (!identityToken) {
        throw new Error(
          'identityToken이 없습니다. (실기기/Sign In with Apple Capability/서명 설정 확인 필요)',
        );
      }

 // 2) 서버 로그인은 thunk에서 처리 (카카오랑 동일)
      const loginAction = dispatch(appleLoginThunk(identityToken));
      const loginResult =
        typeof loginAction?.unwrap === 'function'
          ? await loginAction.unwrap()
          : await loginAction;
      loginConfirmed = true;

      // 전화번호 미인증 — 인증 화면으로 분기 (MMKV 먼저: RootScreen 동기 읽기·리렌더 레이스 방지)
      if (loginResult?.phoneVerified === false) {
        try {
          await setStoredPhoneVerificationPending(true);
        } catch {
          null;
        }
        dispatch(setPhoneVerificationPending());
        dispatch(setAuthChecked(true));
        return;
      }

 // 3) 소켓은 가족 있을 때만
      const hasFamily = !!loginResult?.hasFamily;
      if (hasFamily && !socketUnsubRef.current) {
          socketUnsubRef.current = startChatSocket(dispatch, store.getState);
      }

 // 4) 마지막에 authChecked true
      dispatch(setAuthChecked(true));

    } catch (e) {
      const alreadyLoggedIn = loginConfirmed || !!store.getState()?.login?.isLoggedIn;

      if (alreadyLoggedIn) {
        dispatch(setLoginError(null));
        dispatch(setAuthChecked(true));
        return;
      }

      // 인터셉터에서 이미 Alert 처리됨 — 중복 소셜 프로바이더는 추가 Alert 없이 정리만
      const isDuplicateProvider =
        e?.response?.status === 409 &&
        e?.response?.data?.code === 'DUPLICATE_SOCIAL_PROVIDER';

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
      if (isDuplicateProvider) {
        dispatch(setLoginError(null));
      } else {
        dispatch(setLoginError(e?.message ?? '애플 로그인 실패'));
        Alert.alert('애플 로그인 실패', e?.message ?? '애플 로그인 실패');
      }
      dispatch(setAuthChecked(true));
    } finally {
      dispatch(setLoginLoading(false));
      inFlightRef.current = false;
    }
  }, [dispatch, store]);

  return {login};
}
