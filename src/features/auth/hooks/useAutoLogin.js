// src/features/auth/hooks/useAutoLogin.js
import {useEffect, useRef} from 'react';
import {useDispatch, useSelector, useStore} from 'react-redux';

import {getToken, deleteLoginInfo, setHasFamily} from 'utils/storage';
import {fetchUserThunk} from 'features/home/store/userThunk';
import {fetchFamilyThunk} from 'features/home/store/familyThunk';
import {fetchFamilyUserListThunk} from 'features/home/store/familyUserThunk';
import {fetchChatRoomListThunk} from 'features/chat/store/chatRoomThunk';
import {startChatSocket, stopChatSocket} from 'features/chat/hooks/ChatSocket';
import {setLoginSuccess, setLogout, setAuthChecked} from '../store/loginSlice';

const withTimeout = (promise, ms = 6000) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`timeout ${ms}ms`)), ms),
    ),
  ]);

export function useAutoLogin(shouldRun = true) {
  const dispatch = useDispatch();
  const store = useStore();

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
 // familyId 추출 보강 (DTO 구조 흔들려도 안전)
          const raw = userResult?.data ?? userResult;
          const familyId = raw?.familyId ?? raw?.family?.familyId ?? null;
          
          const hasFamilyValue = familyId != null;
          console.log('🏷️ [AUTOLOGIN] familyId=', familyId, 'hasFamily=', hasFamilyValue);
          
          await setHasFamily(hasFamilyValue);
          if (hasFamilyValue) {
            const r2 = dispatch(fetchFamilyThunk(familyId));
            if (typeof r2?.unwrap === 'function') await r2.unwrap();
            else await r2;
            console.log('✅ fetchFamily ok');

            const userId = raw?.userId ?? raw?.id ?? null;
            if (userId) {
              dispatch(fetchFamilyUserListThunk(familyId));
              dispatch(fetchChatRoomListThunk(familyId, userId));
            }
          } else {
            console.log('👀 familyId is null -> no family (create/join flow)');
          }
        } catch (e) {
          console.log('⚠️ fetchFamily skip/fail:', e?.message);
        }

        if (cancelled) return;

        if (!socketUnsubRef.current) {
          socketUnsubRef.current = startChatSocket(dispatch, store.getState);
        }
      } catch (err) {
        console.log('🚨 AutoLogin fatal:', err?.message);
        await deleteLoginInfo();
        stopChatSocket();
        dispatch(setLogout());
      } finally {
        if (!cancelled) {
          console.log('✅ AutoLogin done -> authChecked true');
          dispatch(setAuthChecked(true));
        }
        runningRef.current = false;
      }
    };

    run();

    return () => {
      cancelled = true;
      runningRef.current = false;
    };
  }, [dispatch, store, rehydrated, authChecked, shouldRun, loginLoading]);

 // 언마운트 시에만 소켓 정리
  useEffect(() => {
    return () => {
      if (socketUnsubRef.current) {
        socketUnsubRef.current();
        socketUnsubRef.current = null;
      }
    };
  }, []);
}
