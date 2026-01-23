// src/features/auth/hooks/useKakaoLogin.js
import * as KakaoLogin from '@react-native-seoul/kakao-login';
import {useCallback} from 'react';
import {useDispatch} from 'react-redux';

import {loginThunk} from '../store/loginThunk';
import {setLoginError, setLoginLoading, setAuthChecked} from '../store/loginSlice';

export function useKakaoLogin() {
  const dispatch = useDispatch();

  const login = useCallback(async () => {
    dispatch(setLoginLoading(true));
    dispatch(setLoginError(null));

    try {
      const kakao = await KakaoLogin.login();
      console.log('✅ Kakao Login:', kakao);

      // ✅ 서버 로그인/토큰 저장/로그인 성공처리는 thunk에서 일원화
      const r = dispatch(loginThunk(kakao.accessToken));
      if (typeof r?.unwrap === 'function') await r.unwrap();
      else await r;

      // ✅ authChecked는 원래 autoLogin에서 true가 됐을 텐데,
      // 혹시라도 온보딩에서 바로 로그인하는 케이스 대비로 true 보장
      dispatch(setAuthChecked(true));
    } catch (e) {
      console.log('❌ Kakao login fail:', e);
      dispatch(setLoginError(e?.message ?? '로그인 실패'));
      dispatch(setAuthChecked(true));
    } finally {
      dispatch(setLoginLoading(false));
    }
  }, [dispatch]);

  return {login};
}
