/**
 * @fileoverview 루트 화면 컴포넌트
 * 
 * 앱의 초기 라우팅을 결정하는 컴포넌트입니다.
 * - Redux persist rehydration 대기
 * - 자동 로그인 처리
 * - 인증 상태에 따른 네비게이션 분기
 */

import React, {useEffect, useMemo, useState, useCallback} from 'react';
import {ActivityIndicator, View, Text} from 'react-native';
import {useSelector} from 'react-redux';
import {SafeAreaView} from 'react-native-safe-area-context';

import AuthNavigator from './AuthNavigator';
import RootNavigator from './RootNavigator';
import {setGuestMode, getHasFamily, getNeedsSignup} from 'utils/storage';
import {useAutoLogin} from 'features/auth/hooks/useAutoLogin';
import {onAuthFlagsChanged} from 'utils/authFlagsEvent';

// ==================== Components ====================

/**
 * 부팅 로딩 컴포넌트
 * @param {Object} props - 컴포넌트 props
 * @param {string} props.label - 로딩 라벨 텍스트
 */
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

// ==================== Main Component ====================

/**
 * 루트 화면 메인 컴포넌트
 * @returns {JSX.Element} 루트 화면 컴포넌트
 */
export default function RootScreen() {
  const rehydrated = useSelector(state => !!state?._persist?.rehydrated);
  const authChecked = useSelector(state => state.login?.authChecked);
  const isLoggedIn = useSelector(state => state.login?.isLoggedIn);
  const loginLoading = useSelector(state => !!state.login?.loading);

  const [bootChecked, setBootChecked] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [hasFamily, setHasFamily] = useState(null);
  const [needsSignup, setNeedsSignup] = useState(false);
  const [authWaitTimedOut, setAuthWaitTimedOut] = useState(false);

  /**
   * 인증 플래그 새로고침
   */
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
      } catch {null}

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

  /**
   * 자동 로그인 실행 조건
   * loginLoading을 포함하여 경합 방지
   */
  const shouldRunAutoLogin =
    rehydrated && bootChecked && !isGuest && !authChecked && !loginLoading;

  useAutoLogin(shouldRunAutoLogin);

  /**
   * 타겟 네비게이션 결정
   * 인증 상태와 가족 정보에 따라 적절한 네비게이터와 초기 라우트를 반환합니다.
   */
  const target = useMemo(() => {
    if (!rehydrated || !bootChecked) {
      return null;
    }

    // 게스트 모드
    if (isGuest) {
      return {flow: 'AppFlow', initialRouteName: 'Tabs'};
    }

    // 인증 체크 대기 중
    if (!authChecked) {
      // 타임아웃 시 온보딩으로 fallback (무한 로딩 방지)
      if (authWaitTimedOut) {
        return {flow: 'AuthFlow', initialRouteName: '온보딩화면'};
      }
      return null;
    }

    // 로그인되지 않음
    if (!isLoggedIn) {
      return {flow: 'AuthFlow', initialRouteName: '온보딩화면'};
    }

    // 가족이 있는 경우
    if (hasFamily === true) {
      return {flow: 'AppFlow', initialRouteName: 'Tabs'};
    }

    // 가족이 없는 경우 (회원가입 필요)
    if (hasFamily === false) {
      return {flow: 'AuthFlow', initialRouteName: '약관동의화면'};
    }

    // 기본값: 앱 플로우
    return {flow: 'AppFlow', initialRouteName: 'Tabs'};
  }, [
    rehydrated,
    bootChecked,
    isGuest,
    authChecked,
    isLoggedIn,
    hasFamily,
    authWaitTimedOut,
  ]);

  // 타겟이 결정되지 않았으면 로딩 표시
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

  // 인증 플로우 또는 앱 플로우로 분기
  if (target.flow === 'AuthFlow') {
    return <AuthNavigator initialRouteName={target.initialRouteName} />;
  }
  return <RootNavigator initialRouteName={target.initialRouteName} />;
}
