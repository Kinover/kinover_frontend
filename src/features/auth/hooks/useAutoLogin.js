// src/features/auth/hooks/useAutoLogin.js
import {useEffect, useRef} from 'react';
import {useDispatch, useSelector} from 'react-redux';

import {getToken, deleteLoginInfo, setHasFamily} from 'utils/storage';
import {fetchUserThunk} from 'features/home/store/userThunk';
import {fetchFamilyThunk} from 'features/home/store/familyThunk';
import store from 'store';

import {startChatSocket, stopChatSocket} from 'features/chat/hooks/ChatSocket';
import {setLoginSuccess, setLogout, setAuthChecked} from '../store/loginSlice';

const withTimeout = (promise, ms = 6000) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`timeout ${ms}ms`)), ms),
    ),
  ]);

export function useAutoLogin() {
  const dispatch = useDispatch();

  // ✅ 핵심: authChecked 상태를 보고 "필요할 때만" 실행
  const authChecked = useSelector(state => state.login?.authChecked);

  // ✅ 중복 실행 방지(동일 세션에서만)
  const runningRef = useRef(false);
  const socketUnsubRef = useRef(null);

  useEffect(() => {
    // ✅ 이미 체크 완료면 더 이상 실행할 필요 없음
    if (authChecked) return;

    // ✅ 이미 실행 중이면 중복 실행 방지
    if (runningRef.current) return;
    runningRef.current = true;

    const run = async () => {
      console.log('🚀 AutoLogin start');

      try {
        const token = await withTimeout(getToken(), 6000);
        console.log('🔐 token:', token ? 'YES' : 'NO');

        if (!token) {
          stopChatSocket();
          dispatch(setLogout());
          return;
        }

        // ✅ 토큰 유효성은 유저 조회로 확정
        try {
          const r = dispatch(fetchUserThunk());
          if (typeof r?.unwrap === 'function') {
            await withTimeout(r.unwrap(), 8000);
          } else {
            await withTimeout(r, 8000);
          }
          console.log('✅ fetchUser ok');
        } catch (e) {
          console.log('❌ fetchUser fail => logout', e?.message);
          await deleteLoginInfo();
          stopChatSocket();
          dispatch(setLogout());
          return;
        }

        dispatch(setLoginSuccess());

        // ✅ 가족 정보(있으면)
        try {
          const state = store.getState();
          const userState = state.user;
          const user = userState?.user ?? userState ?? null;
          const familyId = user?.familyId ?? null;

          const hasFamily = !!familyId;
          await setHasFamily(hasFamily);

          if (hasFamily && familyId) {
            const r2 = dispatch(fetchFamilyThunk(familyId));
            if (typeof r2?.unwrap === 'function') await r2.unwrap();
            else await r2;
            console.log('✅ fetchFamily ok');
          }
        } catch (e) {
          console.log('⚠️ fetchFamily skip/fail:', e?.message);
        }

        // ✅ 소켓 시작(필요 시 1회)
        if (!socketUnsubRef.current) {
          socketUnsubRef.current = startChatSocket(dispatch);
        }
      } catch (err) {
        console.log('🚨 AutoLogin fatal:', err?.message);
        await deleteLoginInfo();
        stopChatSocket();
        dispatch(setLogout());
      } finally {
        console.log('✅ AutoLogin done -> authChecked true');
        dispatch(setAuthChecked(true));
        runningRef.current = false;
      }
    };

    run();

    return () => {
      // ✅ 언마운트 시 소켓 구독 해제
      if (socketUnsubRef.current) {
        socketUnsubRef.current();
        socketUnsubRef.current = null;
      }
      runningRef.current = false;
    };
  }, [dispatch, authChecked]);
}
