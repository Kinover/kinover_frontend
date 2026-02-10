// src/navigation/rootScreen.jsx
import React, {useEffect, useMemo, useState, useCallback} from 'react';
import {ActivityIndicator, View, Text} from 'react-native';
import {useSelector} from 'react-redux';
import {SafeAreaView} from 'react-native-safe-area-context';

import AuthNavigator from './authNavigator';
import RootNavigator from './rootNavigator';

import {setGuestMode, getHasFamily, getNeedsSignup} from 'utils/storage';
import {useAutoLogin} from 'features/auth/hooks/useAutoLogin';
import {onAuthFlagsChanged} from 'utils/authFlagsEvent';

function BootLoading({label = ''}) {
  return (
    <SafeAreaView style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <ActivityIndicator />
      <View style={{height: 8}} />
      {!!label && (
        <Text allowFontScaling={false} style={{color: '#666', fontSize: 12}}>
          {/* {label} */}
        </Text>
      )}
    </SafeAreaView>
  );
}

export default function RootScreen() {
  const rehydrated = useSelector(state => !!state?._persist?.rehydrated);
  const authChecked = useSelector(state => state.login?.authChecked);
  const isLoggedIn = useSelector(state => state.login?.isLoggedIn);
  const loginLoading = useSelector(state => !!state.login?.loading);

  const [bootChecked, setBootChecked] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  const [hasFamily, setHasFamily] = useState(null);
  const [needsSignup, setNeedsSignup] = useState(false);

  // ✅ (추가) authChecked가 너무 오래 false로 남을 때 fallback 타이머
  const [authWaitTimedOut, setAuthWaitTimedOut] = useState(false);

  const refreshAuthFlags = useCallback(async () => {
    try {
      const [hf, ns] = await Promise.all([getHasFamily(), getNeedsSignup()]);
      setHasFamily(hf);
      setNeedsSignup(!!ns);
    } catch {
      setHasFamily(null);
      setNeedsSignup(false);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthFlagsChanged(() => {
      refreshAuthFlags();
    });
    return unsub;
  }, [refreshAuthFlags]);

  useEffect(() => {
    if (!rehydrated) return;

    let mounted = true;

    (async () => {
      try {
        await setGuestMode(false);
      } catch {}

      if (!mounted) return;
      setIsGuest(false);

      await refreshAuthFlags();

      if (!mounted) return;
      setBootChecked(true);
    })();

    return () => {
      mounted = false;
    };
  }, [rehydrated, refreshAuthFlags]);

  // ✅ authChecked true가 되면 flags를 한 번 더 강제 재조회
  useEffect(() => {
    if (!rehydrated) return;
    if (!authChecked) return;
    refreshAuthFlags();
  }, [rehydrated, authChecked, refreshAuthFlags]);

  // ✅ (추가) authChecked가 false인 상태가 너무 길면 fallback
  useEffect(() => {
    if (!rehydrated || !bootChecked) return;

    // 이미 체크 끝났으면 타임아웃 필요 없음
    if (authChecked) {
      setAuthWaitTimedOut(false);
      return;
    }

    setAuthWaitTimedOut(false);
    const t = setTimeout(() => {
      setAuthWaitTimedOut(true);
    }, 5500);

    return () => clearTimeout(t);
  }, [rehydrated, bootChecked, authChecked]);

  // ✅ 오토로그인 실행 조건에 loginLoading도 포함 (경합 방지)
  const shouldRunAutoLogin =
    rehydrated && bootChecked && !isGuest && !authChecked && !loginLoading;

  useAutoLogin(shouldRunAutoLogin);

  // ✅ 디버깅용 (원인 확정에 매우 도움, 안정화 후 지워도 됨)
  // console.log('[ROOT FLAGS]', {rehydrated, bootChecked, isGuest, authChecked, isLoggedIn, loginLoading, hasFamily, needsSignup, shouldRunAutoLogin, authWaitTimedOut});

  const target = useMemo(() => {
    if (!rehydrated) return null;
    if (!bootChecked) return null;

    if (isGuest) {
      return {flow: 'AppFlow', initialRouteName: 'Tabs'};
    }

    // ✅ authChecked가 아직 false면:
    // - 오토로그인 시도 중/대기 중이면 로딩 유지
    // - 너무 오래 걸리면 온보딩으로 fallback (무한로딩 방지)
    if (!authChecked) {
      if (authWaitTimedOut) {
        return {flow: 'AuthFlow', initialRouteName: '온보딩화면'};
      }
      return null;
    }

    if (!isLoggedIn) {
      return {flow: 'AuthFlow', initialRouteName: '온보딩화면'};
    }

    if (hasFamily === true) {
      return {flow: 'AppFlow', initialRouteName: 'Tabs'};
    }

    if (hasFamily === false) {
      return {flow: 'AuthFlow', initialRouteName: '약관동의화면'};
    }

    return {flow: 'AppFlow', initialRouteName: 'Tabs'};
  }, [rehydrated, bootChecked, isGuest, authChecked, isLoggedIn, hasFamily, authWaitTimedOut]);

  if (!target) {
    const label = !rehydrated
      ? 'rehydrated 대기'
      : !bootChecked
      ? 'bootChecked 대기'
      : loginLoading
      ? 'loginLoading...'
      : !authChecked
      ? 'authChecked 대기(오토로그인)'
      : '';
    return <BootLoading label={label} />;
  }

  if (target.flow === 'AuthFlow') {
    return <AuthNavigator initialRouteName={target.initialRouteName} />;
  }
  return <RootNavigator initialRouteName={target.initialRouteName} />;
}
