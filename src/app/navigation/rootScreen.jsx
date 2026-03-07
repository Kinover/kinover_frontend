import React, {useEffect, useState} from 'react';
import {ActivityIndicator, View, Text, Image, StyleSheet} from 'react-native';
import {useSelector} from 'react-redux';
import {SafeAreaView} from 'react-native-safe-area-context';

import AuthNavigator from './authNavigator';
import RootNavigator from './rootNavigator';
import {setGuestMode, getHasFamily, getNeedsSignup} from 'utils/storage';
import {useAutoLogin} from 'features/auth/hooks/useAutoLogin';
import {onAuthFlagsChanged} from 'utils/authFlagsEvent';

function BootLoading({label = ''}) {
  return (
    <SafeAreaView style={styles.bootContainer}>
      <Image
        source={require('../../assets/images/kinover!!.png')}
        style={styles.bootLogo}
        resizeMode="contain"
      />
      <View style={{height: 14}} />
      <ActivityIndicator />
      <View style={{height: 8}} />
      {!!label && (
        <Text allowFontScaling={false} style={styles.bootLabel}>
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
    } else if (needsSignup) {
      target = {flow: 'AuthFlow', initialRouteName: '약관동의화면'};
    } else if (hasFamily === true) {
      target = {flow: 'AppFlow', initialRouteName: 'Tabs'};
    } else if (hasFamily === false) {
      target = {flow: 'AuthFlow', initialRouteName: '약관동의화면'};
    } else {
      // hasFamily 미확정(null) 상태에서는 Tabs로 먼저 보내지 않고 로딩 유지
      target = null;
    }
  }

  if (!target) {
    const label = !rehydrated
      ? '앱 데이터를 불러오고 있어요'
      : !bootDone
      ? '초기 설정을 준비하고 있어요'
      : loginLoading
      ? '로그인 상태를 확인하고 있어요'
      : !authChecked
      ? '자동 로그인 중이에요'
      : '잠시만 기다려 주세요';
    return <BootLoading label={label} />;
  }

  if (target.flow === 'AuthFlow') {
    return <AuthNavigator initialRouteName={target.initialRouteName} />;
  }
  return <RootNavigator initialRouteName={target.initialRouteName} />;
}

const styles = StyleSheet.create({
  bootContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  bootLogo: {
    width: 168,
    height: 58,
  },
  bootLabel: {
    color: '#666',
    fontSize: 12,
  },
});
