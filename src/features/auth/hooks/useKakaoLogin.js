// src/features/auth/hooks/useKakaoLogin.js
import * as KakaoLogin from '@react-native-seoul/kakao-login';
import {useCallback, useRef} from 'react';
import {useDispatch} from 'react-redux';

import {setHasFamily, deleteLoginInfo} from 'utils/storage';
import {loginThunk} from '../store/loginThunk';
import {fetchUserThunk} from 'features/home/store/userThunk';

import {startChatSocket, stopChatSocket} from 'features/chat/hooks/ChatSocket';
import {
  setLoginError,
  setLoginLoading,
  setAuthChecked,
  setLoginSuccess,
  setLogout,
} from '../store/loginSlice';

const withTimeout = (promise, ms = 8000) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`timeout ${ms}ms`)), ms),
    ),
  ]);

export function useKakaoLogin() {
  const dispatch = useDispatch();
  const socketUnsubRef = useRef(null);

  const login = useCallback(async () => {
    dispatch(setLoginLoading(true));
    dispatch(setLoginError(null));

    try {
      const kakao = await KakaoLogin.login();
      console.log('✅ Kakao Login:', kakao);

      // 1) 서버 로그인
      const r = dispatch(loginThunk(kakao.accessToken));
      const loginResult =
        typeof r?.unwrap === 'function'
          ? await withTimeout(r.unwrap(), 12000)
          : await withTimeout(r, 12000);

      // ✅ 로그인 성공은 무조건 확정 (중요)
      dispatch(setLoginSuccess());

      // ✅ hasFamily 판단은 "로그인 성공 후" 플로우 분기용
      const hasFamilyFromLogin = !!loginResult?.hasFamily;
      // await setHasFamily(hasFamilyFromLogin);

      // ✅ 소켓은 '메인 진입'에서만 필요하면 hasFamily일 때만 시작
      if (hasFamilyFromLogin && !socketUnsubRef.current) {
        socketUnsubRef.current = startChatSocket(dispatch);
      }

      // 2) 유저 fetch(권장: 로그인 성공 후)
      try {
        const r2 = dispatch(fetchUserThunk());
        if (r2 && typeof r2.then === 'function') {
          await withTimeout(r2, 8000);
        } else {
          await new Promise(res => setTimeout(res, 0));
        }
      } catch (e) {
        console.log('⚠️ fetchUser during login failed:', e?.message);
      }

      // ✅ 마지막에 authChecked true
      dispatch(setAuthChecked(true));
    } catch (e) {
      console.log('❌ Kakao login fail:', e);

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
      dispatch(setLoginError(e?.message ?? '로그인 실패'));
      dispatch(setAuthChecked(true));
    } finally {
      dispatch(setLoginLoading(false));
    }
  }, [dispatch]);

  return {login};
}
