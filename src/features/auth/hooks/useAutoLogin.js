// src/features/auth/hooks/useAutoLogin.js
import {useEffect, useRef} from 'react';
import {useDispatch, useSelector} from 'react-redux';

import {getToken, deleteLoginInfo, setHasFamily} from 'utils/storage';
import {fetchUserThunk} from 'features/home/store/userThunk';
import {fetchFamilyThunk} from 'features/home/store/familyThunk';
import {startChatSocket, stopChatSocket} from 'features/chat/hooks/ChatSocket';
import {setLoginSuccess, setLogout, setAuthChecked} from '../store/loginSlice';

// ✅ 추가: flags 변경 이벤트 발행(없으면 utils/authFlagsEvent에 만들어야 함)
import {emitAuthFlagsChanged} from 'utils/authFlagsEvent';

const withTimeout = (promise, ms = 6000) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`timeout ${ms}ms`)), ms),
    ),
  ]);

export function useAutoLogin(shouldRun = true) {
  const dispatch = useDispatch();

  const rehydrated = useSelector(state => !!state?._persist?.rehydrated);
  const authChecked = useSelector(state => state.login?.authChecked);
  const loginLoading = useSelector(state => !!state.login?.loading);

  const runningRef = useRef(false);
  const socketUnsubRef = useRef(null);

  useEffect(() => {
    if (!shouldRun) return;
    if (!rehydrated) return;
    if (authChecked) return;
    if (loginLoading) return;

    if (runningRef.current) return;
    runningRef.current = true;

    let cancelled = false;

    const run = async () => {
      console.log('🚀 AutoLogin start');

      try {
        const token = await withTimeout(getToken(), 6000);
        console.log('🔐 token:', token ? 'YES' : 'NO');

        if (cancelled) return;

        if (!token) {
          stopChatSocket();
          dispatch(setLogout());
          return;
        }

        let userResult = null;
        try {
          const r = dispatch(fetchUserThunk());
          userResult =
            typeof r?.unwrap === 'function'
              ? await withTimeout(r.unwrap(), 8000)
              : await withTimeout(r, 8000);
          console.log('✅ fetchUser ok');
        } catch (e) {
          console.log('❌ fetchUser fail => logout', e?.message);
          await deleteLoginInfo();
          stopChatSocket();
          dispatch(setLogout());
          return;
        }

        if (cancelled) return;

        dispatch(setLoginSuccess());

        try {
          const familyId = userResult?.familyId ?? null;
          const hasFamilyValue = !!familyId;

          await setHasFamily(hasFamilyValue);

          // ✅✅✅ Root가 즉시 refreshAuthFlags 하도록 “이벤트 발행”
          try {
            emitAuthFlagsChanged?.();
          } catch {}

          if (hasFamilyValue) {
            const r2 = dispatch(fetchFamilyThunk(familyId));
            if (typeof r2?.unwrap === 'function') await r2.unwrap();
            else await r2;
            console.log('✅ fetchFamily ok');
          } else {
            console.log('👀 familyId is null -> no family (create/join flow)');
          }
        } catch (e) {
          console.log('⚠️ fetchFamily skip/fail:', e?.message);
        }

        if (cancelled) return;

        if (!socketUnsubRef.current) {
          socketUnsubRef.current = startChatSocket(dispatch);
        }
      } catch (err) {
        console.log('🚨 AutoLogin fatal:', err?.message);
        await deleteLoginInfo();
        stopChatSocket();
        dispatch(setLogout());
      } finally {
        if (cancelled) {
          runningRef.current = false;
          return;
        }
        console.log('✅ AutoLogin done -> authChecked true');
        dispatch(setAuthChecked(true));
        runningRef.current = false;
      }
    };

    run();

    return () => {
      cancelled = true;

      // ✅ shouldRun 변동으로 cleanup이 타더라도, 소켓 끊기는 게 싫으면 여기 제거 가능
      if (socketUnsubRef.current) {
        socketUnsubRef.current();
        socketUnsubRef.current = null;
      }
      runningRef.current = false;
    };
  }, [dispatch, rehydrated, authChecked, shouldRun, loginLoading]);
}
