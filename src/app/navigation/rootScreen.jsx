import React, {useEffect, useState} from 'react';
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
    <SafeAreaView
      style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <ActivityIndicator />
      <View style={{height: 8}} />
      {!!label && (
        <Text allowFontScaling={false} style={{color: '#666', fontSize: 12}}>
          {label}
        </Text>
      )}
    </SafeAreaView>
  );
}

export default function RootScreen() {
  const rehydrated = useSelector(state => !!state?._persist?.rehydrated);
  const authChecked = useSelector(state => state.login?.authChecked);
  const isLogin = useSelector(state => state.login?.isLoggedIn);
  const loginLoading = useSelector(state => !!state.login?.loading);

  const [bootDone, setBootDone] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [hasFamily, setHasFamily] = useState(null);
  const [needsSignup, setNeedsSignup] = useState(false);
  const [authTimeout, setAuthTimeout] = useState(false);

  async function refreshAuthFlags() {
    try {
      const [hf, ns] = await Promise.all([getHasFamily(), getNeedsSignup()]);
      setHasFamily(hf);
      setNeedsSignup(!!ns);
    } catch {
      setHasFamily(null);
      setNeedsSignup(false);
    }
  }

  useEffect(() => {
    const unsub = onAuthFlagsChanged(() => refreshAuthFlags());
    return unsub;
  }, []);

  useEffect(() => {
    if (!rehydrated) return;

    let mounted = true;

    (async () => {
      try {
        await setGuestMode(false);
      } catch {null}

      if (!mounted) return;
      setIsGuest(false);

      await refreshAuthFlags();

      if (!mounted) return;
      setBootDone(true);
    })();

    return () => {
      mounted = false;
    };
  }, [rehydrated]);

  useEffect(() => {
    if (!rehydrated) return;
    if (!authChecked) return;
    refreshAuthFlags();
  }, [rehydrated, authChecked]);

  useEffect(() => {
    if (!rehydrated || !bootDone) return;

    if (authChecked) {
      setAuthTimeout(false);
      return;
    }

    setAuthTimeout(false);
    const t = setTimeout(() => setAuthTimeout(true), 5500);

    return () => clearTimeout(t);
  }, [rehydrated, bootDone, authChecked]);

  const shouldRunAutoLogin =
    rehydrated && bootDone && !isGuest && !authChecked && !loginLoading;

  useAutoLogin(shouldRunAutoLogin);

  // 어디로 갈지 결정
  let target = null;
  if (rehydrated && bootDone) {
    if (isGuest) {
      target = {flow: 'AppFlow', initialRouteName: 'Tabs'};
    } else if (!authChecked) {
      if (authTimeout) {
        target = {flow: 'AuthFlow', initialRouteName: '온보딩화면'};
      }
    } else if (!isLogin) {
      target = {flow: 'AuthFlow', initialRouteName: '온보딩화면'};
    } else if (hasFamily === true) {
      target = {flow: 'AppFlow', initialRouteName: 'Tabs'};
    } else if (hasFamily === false) {
      target = {flow: 'AuthFlow', initialRouteName: '약관동의화면'};
    } else {
      target = {flow: 'AppFlow', initialRouteName: 'Tabs'};
    }
  }

  if (!target) {
    const label = !rehydrated
      ? 'rehydrated 대기'
      : !bootDone
      ? 'bootDone 대기'
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
