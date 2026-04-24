// src/features/auth/hooks/useKakaoLogin.js
import * as KakaoLogin from '@react-native-seoul/kakao-login';
import {useCallback, useRef} from 'react';
import {Alert} from 'react-native';
import {useDispatch, useStore} from 'react-redux';

import {deleteLoginInfo} from 'utils/storage';
import {loginThunk} from '../store/loginThunk';
import {applySignupRoutingAfterSocialLogin} from '../utils/applySignupRoutingAfterSocialLogin';
import {isKakaoLoginCancelledError} from '../utils/isKakaoLoginCancelledError';

import {
  ensureChatSocketIfSignedIn,
  stopChatSocket,
} from 'features/chat/hooks/ChatSocket';
import {
  setLoginError,
  setLoginLoading,
  setAuthChecked,
  setLogout,
} from '../store/loginSlice';

export function useKakaoLogin() {
  const dispatch = useDispatch();
  const store = useStore();
  const inFlightRef = useRef(false);

  const login = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    dispatch(setLoginLoading(true));
    dispatch(setLoginError(null));

    let loginConfirmed = false;
    try {
      const kakao = await KakaoLogin.login();

 // 1) 서버 로그인
      const loginAction = dispatch(loginThunk(kakao.accessToken));
      const loginResult =
        typeof loginAction?.unwrap === 'function'
          ? await loginAction.unwrap()
          : await loginAction;
      loginConfirmed = true;

      await applySignupRoutingAfterSocialLogin(loginResult, dispatch);

      await ensureChatSocketIfSignedIn(dispatch, store.getState);

      if (loginResult?.needsSignup) {
        dispatch(setAuthChecked(true));
        return;
      }

      // 전화번호 미인증 — 인증 화면으로 분기 (MMKV 먼저: RootScreen 동기 읽기·리렌더 레이스 방지)
      if (loginResult?.phoneVerified === false) {
        dispatch(setAuthChecked(true));
        return;
      }

      dispatch(setAuthChecked(true));
    } catch (e) {
      if (isKakaoLoginCancelledError(e)) {
        dispatch(setLoginError(null));
        return;
      }

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
      } catch (err) {
        null;
      }
      try {
        stopChatSocket();
      } catch (err) {
        null;
      }

      dispatch(setLogout());
      if (isDuplicateProvider) {
        dispatch(setLoginError(null));
      } else {
        const errorMessage =
          e?.response?.data?.message ||
          (typeof e?.response?.data === 'string' ? e.response.data : null) ||
          e?.data?.message ||
          (typeof e?.data === 'string' ? e.data : null) ||
          e?.message ||
          '로그인 실패';
        dispatch(setLoginError(errorMessage));
        Alert.alert('카카오 로그인 실패', String(errorMessage));
      }
      dispatch(setAuthChecked(true));
    } finally {
      dispatch(setLoginLoading(false));
      inFlightRef.current = false;
    }
  }, [dispatch, store]);

  return {login};
}
