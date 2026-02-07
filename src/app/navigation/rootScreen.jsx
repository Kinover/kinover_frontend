// src/navigation/rootScreen.jsx
import React, {useEffect, useMemo, useState, useCallback} from 'react';
import {ActivityIndicator, View} from 'react-native';
import {useSelector} from 'react-redux';
import {SafeAreaView} from 'react-native-safe-area-context';

import AuthNavigator from './authNavigator';
import RootNavigator from './rootNavigator';

import {setGuestMode, getHasFamily, getNeedsSignup} from 'utils/storage';
import {useAutoLogin} from 'features/auth/hooks/useAutoLogin';

import {onAuthFlagsChanged} from 'utils/authFlagsEvent';

function BootLoading() {
  return (
    <SafeAreaView style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <ActivityIndicator />
      <View style={{height: 8}} />
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

  // ✅ authChecked true가 되면(오토로그인 완료 포함) flags를 한 번 더 강제 재조회
  useEffect(() => {
    if (!rehydrated) return;
    if (!authChecked) return;
    refreshAuthFlags();
  }, [rehydrated, authChecked, refreshAuthFlags]);

  const shouldRunAutoLogin =
  rehydrated && bootChecked && !isGuest && !authChecked;

  useAutoLogin(shouldRunAutoLogin);

  const target = useMemo(() => {
    if (!rehydrated) return null;
    if (!bootChecked) return null;

    if (isGuest) {
      return {flow: 'AppFlow', initialRouteName: 'Tabs'};
    }

    if (!authChecked) return null;

    if (!isLoggedIn) {
      return {flow: 'AuthFlow', initialRouteName: '온보딩화면'};
    }

    // ✅ 여기부터는 로그인 된 상태

    if (hasFamily === true) {
      return {flow: 'AppFlow', initialRouteName: 'Tabs'};
    }

    if (hasFamily === false) {
      return {flow: 'AuthFlow', initialRouteName: '약관동의화면'};
    }

    // ✅ hasFamily === null 이면 원래는 무한 BootLoading인데,
    // 화면 멈춤 방지용 fallback (원치 않으면 제거 가능)
    return {flow: 'AppFlow', initialRouteName: 'Tabs'};
  }, [rehydrated, bootChecked, isGuest, authChecked, isLoggedIn, hasFamily]);

  if (!target) return <BootLoading />;

  if (target.flow === 'AuthFlow') {
    return <AuthNavigator initialRouteName={target.initialRouteName} />;
  }
  return <RootNavigator initialRouteName={target.initialRouteName} />;
}
