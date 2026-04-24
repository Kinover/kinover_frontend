import React, {useEffect, useState, useRef, useReducer, useCallback} from 'react';
import {View, StyleSheet} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {SafeAreaView} from 'react-native-safe-area-context';

import AuthNavigator from './authNavigator';
import RootNavigator from './rootNavigator';
import {
  ensureStorageDefaultsOnce,
  getAuthRoutingMmkvSnapshotSync,
  SIGNUP_PROGRESS_STEP,
} from 'utils/storage';
import {useAutoLogin} from 'features/auth/hooks/useAutoLogin';
import {onAuthFlagsChanged} from 'utils/authFlagsEvent';
import AppText from 'components/AppText';
import YellowSpinner from 'components/yellowSpinner';
import {setPhoneVerificationPending} from 'features/auth/store/loginSlice';

function BootLoading({label = ''}) {
  return (
    <SafeAreaView style={styles.bootContainer}>
      <View
        style={styles.bootSpinnerWrap}
        accessibilityRole="progressbar"
        accessibilityLabel="불러오는 중"
        accessibilityState={{busy: true}}>
        <YellowSpinner />
      </View>
      <View style={{height: 10}} />
      {!!label && (
        <AppText allowFontScaling={false} style={styles.bootLabel}>
          {label}
        </AppText>
      )}
    </SafeAreaView>
  );
}

export default function RootScreen() {
  const dispatch = useDispatch();
  const rehydrated = useSelector(state => !!state?._persist?.rehydrated);
  const authChecked = useSelector(state => state.login?.authChecked);
  const isLogin = useSelector(state => state.login?.isLoggedIn);
  const loginLoading = useSelector(state => !!state.login?.loading);
  const user = useSelector(state => state.user);
  /** 전화 인증 완료 직후 MMKV·emit 레이스로 플래그가 잠깐 살아도 전화 화면으로 되돌리지 않음 */
  const serverPhoneVerifiedHint = user?.phoneVerified === true;

  const [bootDone, setBootDone] = useState(false);
  const [_authTimeout, setAuthTimeout] = useState(false);
  const phonePendingHydratedRef = useRef(false);

  /** MMKV emit 시 라우트 재계산 (스냅샷은 렌더마다 동기 읽음) */
  const [, bumpMmkvRoute] = useReducer(c => c + 1, 0);
  const refreshAuthFlags = useCallback(() => {
    bumpMmkvRoute();
  }, []);

  useEffect(() => {
    const unsub = onAuthFlagsChanged(() => refreshAuthFlags());
    return unsub;
  }, [refreshAuthFlags]);

  useEffect(() => {
    if (!rehydrated) return;

    let mounted = true;

    (async () => {
      try {
        await ensureStorageDefaultsOnce();
      } catch {null}

      if (!mounted) return;

      refreshAuthFlags();

      if (!mounted) return;
      setBootDone(true);
    })();

    return () => {
      mounted = false;
    };
  }, [rehydrated, refreshAuthFlags]);

  useEffect(() => {
    if (!rehydrated) return;
    if (!authChecked) return;
    refreshAuthFlags();
  }, [rehydrated, authChecked, refreshAuthFlags]);

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
    rehydrated && bootDone && !authChecked && !loginLoading;

  useAutoLogin(shouldRunAutoLogin);

  useEffect(() => {
    if (!isLogin) {
      phonePendingHydratedRef.current = false;
    }
  }, [isLogin]);

  // 로그인 슬라이스는 persist 안 함 → MMKV 기준으로 Redux 전화 대기만 1회 동기화(비동기 getItem 레이스 방지)
  useEffect(() => {
    if (!rehydrated || !bootDone || !authChecked || !isLogin) return;
    if (phonePendingHydratedRef.current) return;
    phonePendingHydratedRef.current = true;
    const p = getAuthRoutingMmkvSnapshotSync().mmkvPhoneVerificationPending;
    if (p) {
      dispatch(setPhoneVerificationPending());
    }
  }, [rehydrated, bootDone, authChecked, isLogin, dispatch]);

  const mmkvRoute = getAuthRoutingMmkvSnapshotSync();
  const {
    hasFamily: mmkvHasFamily,
    needsSignup,
    signupProgressStep,
    mmkvPhoneVerificationPending,
    signupAwaitingPhone,
    signupRequiresPhone,
    hasPendingSignupTerms,
  } = mmkvRoute;

  /** 전화 화면 분기는 MMKV만 신뢰(Redux는 레이스·하이드레이션에 오래 true로 남을 수 있음) */
  const mmkvWantsPhoneScreenRaw =
    mmkvPhoneVerificationPending ||
    signupAwaitingPhone ||
    signupRequiresPhone;
  const mmkvWantsPhoneScreen =
    mmkvWantsPhoneScreenRaw && !serverPhoneVerifiedHint;

  // 스토리지 값이 비어 있어도 fetchUser 결과로 hasFamily를 안전하게 추론
  const derivedFamilyId = user?.familyId ?? null;
  const effectiveHasFamily = mmkvHasFamily != null
    ? mmkvHasFamily
    : authChecked && isLogin && user?.userId != null
    ? derivedFamilyId != null
    : null;

  // 어디로 갈지 결정
  let target = null;
  if (rehydrated && bootDone) {
    if (!authChecked) {
      // 자동로그인 진행 중에는 timeout으로 온보딩으로 강제 이동하지 않음
      target = null;
    } else if (!isLogin) {
      target = {flow: 'AuthFlow', initialRouteName: '온보딩화면'};
    } else if (needsSignup) {
      const p = signupProgressStep;
      const pastPhoneInSignupFlow =
        p === SIGNUP_PROGRESS_STEP.TERMS ||
        p === SIGNUP_PROGRESS_STEP.PROFILE ||
        p === SIGNUP_PROGRESS_STEP.FAMILY ||
        p === SIGNUP_PROGRESS_STEP.FINISH;
      const resumePhone =
        !pastPhoneInSignupFlow &&
        !serverPhoneVerifiedHint &&
        (p === SIGNUP_PROGRESS_STEP.PHONE ||
          ((p == null || String(p).trim() === '') &&
            mmkvPhoneVerificationPending) ||
          mmkvWantsPhoneScreenRaw);
      if (resumePhone) {
        target = {flow: 'AuthFlow', initialRouteName: '전화번호인증화면'};
      } else if (p === SIGNUP_PROGRESS_STEP.PROFILE) {
        // 구버전 MMKV(profile 단계) 복구: 유저정보세팅 화면은 가입 플로우에서 제거됨 → 약관
        target = {flow: 'AuthFlow', initialRouteName: '약관동의화면'};
      } else if (
        p === SIGNUP_PROGRESS_STEP.FAMILY &&
        !serverPhoneVerifiedHint &&
        mmkvWantsPhoneScreenRaw
      ) {
        target = {flow: 'AuthFlow', initialRouteName: '전화번호인증화면'};
      } else if (p === SIGNUP_PROGRESS_STEP.FAMILY) {
        target = {flow: 'AuthFlow', initialRouteName: '가족설정화면'};
      } else if (p === SIGNUP_PROGRESS_STEP.FINISH) {
        target = {flow: 'AuthFlow', initialRouteName: '설정완료화면'};
      } else if (
        hasPendingSignupTerms &&
        (p == null || String(p).trim() === '')
      ) {
        target = {flow: 'AuthFlow', initialRouteName: '약관동의화면'};
      } else {
        // signupProgressStep === terms: 약관 단계
        target = {flow: 'AuthFlow', initialRouteName: '약관동의화면'};
      }
    } else if (mmkvWantsPhoneScreen) {
      target = {flow: 'AuthFlow', initialRouteName: '전화번호인증화면'};
    } else if (effectiveHasFamily === true) {
      target = {flow: 'AppFlow', initialRouteName: 'Tabs'};
    } else if (effectiveHasFamily === false) {
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
    // initialRouteName마다 key를 바꾸면 스택이 매번 초기화되어 replace·params가 날아가고
    // 약관/프로필을 두 번 거치는 현상이 난다. 로그인·가입 필요 여부 단위로만 리마운트한다.
    return (
      <AuthNavigator
        key={`AuthFlow:${isLogin}-${needsSignup}`}
        initialRouteName={target.initialRouteName}
      />
    );
  }
  return (
    <RootNavigator
      key={`AppFlow:${target.initialRouteName}`}
      initialRouteName={target.initialRouteName}
    />
  );
}

const styles = StyleSheet.create({
  bootContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  bootSpinnerWrap: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bootLabel: {
    color: '#666',
    fontSize: 12,
  },
});
