import React, {
  useEffect,
  useState,
  useRef,
  useReducer,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import {View, StyleSheet, Linking} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {SafeAreaView} from 'react-native-safe-area-context';
import {createStackNavigator} from '@react-navigation/stack';

import AuthNavigator from './authNavigator';
import RootNavigator from './rootNavigator';
import {
  ensureStorageDefaultsOnce,
  getAuthRoutingMmkvSnapshotSync,
  SIGNUP_PROGRESS_STEP,
  setPendingInviteCode,
  getPendingInviteCodeSync,
  clearPendingInviteCode,
} from 'utils/storage';
import {useAutoLogin} from 'features/auth/hooks/useAutoLogin';
import {onAuthFlagsChanged} from 'utils/authFlagsEvent';
import AppText from 'components/AppText';
import YellowSpinner from 'components/yellowSpinner';
import {setPhoneVerificationPending} from 'features/auth/store/loginSlice';
import {
  navigationRef,
  safeReset,
  getResetToMainAppFlowState,
  ROOT_MAIN_APP_SCREEN,
  ROOT_AUTH_FLOW_SCREEN,
} from './navigationService';

const RootFlowStack = createStackNavigator();

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
  const skipFamilyMainEntry = useSelector(
    state => !!state.login?.skipFamilyMainEntry,
  );
  const user = useSelector(state => state.user);
  /** 전화 인증 완료 직후 MMKV·emit 레이스로 플래그가 잠깐 살아도 전화 화면으로 되돌리지 않음 */
  const serverPhoneVerifiedHint = user?.phoneVerified === true;

  const [bootDone, setBootDone] = useState(false);
  const [_authTimeout, setAuthTimeout] = useState(false);
  const phonePendingHydratedRef = useRef(false);
  const isLoginRef = useRef(isLogin);
  const hasFamilyRef = useRef(null);
  const prevRootTargetFlowRef = useRef(null);

  /** MMKV emit 시 라우트 재계산 (스냅샷은 렌더마다 동기 읽음) */
  const [mmkvVersion, bumpMmkvRoute] = useReducer(c => c + 1, 0);
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

  useEffect(() => { isLoginRef.current = isLogin; }, [isLogin]);

  useEffect(() => {
    const handleLiveUrl = ({url}) => {
      if (!url) return;
      try {
        const parsed = new URL(url);
        const code = parsed.searchParams.get('code');
        if (!code) return;
        // 이미 가족이 있는 로그인 유저면 무시
        if (isLoginRef.current && hasFamilyRef.current === true) return;
        setPendingInviteCode(code);
      } catch {}
    };

    // 콜드스타트: auth 확인 전이므로 일단 저장 (아래 effect에서 정리)
    Linking.getInitialURL().then(url => {
      if (!url) return;
      try {
        const parsed = new URL(url);
        const code = parsed.searchParams.get('code');
        if (code) setPendingInviteCode(code);
      } catch {}
    });

    const sub = Linking.addEventListener('url', handleLiveUrl);
    return () => sub.remove();
  }, []);

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

  const target = useMemo(() => {
    const mmkvRoute = getAuthRoutingMmkvSnapshotSync();
    const {
      hasFamily: mmkvHasFamily,
      needsSignup,
      signupProgressStep,
      mmkvPhoneVerificationPending,
      signupAwaitingPhone,
      signupRequiresPhone,
      hasPendingSignupTerms,
      familySetupSkipped,
    } = mmkvRoute;

    const mmkvWantsPhoneScreenRaw =
      mmkvPhoneVerificationPending ||
      signupAwaitingPhone ||
      signupRequiresPhone;
    const mmkvWantsPhoneScreen =
      mmkvWantsPhoneScreenRaw && !serverPhoneVerifiedHint;

    const derivedFamilyId = user?.familyId ?? null;
    const effectiveHasFamily = mmkvHasFamily != null
      ? mmkvHasFamily
      : authChecked && isLogin && user?.userId != null
      ? derivedFamilyId != null
      : null;

    let t = null;

    if (rehydrated && bootDone) {
      if (!authChecked) {
        t = null;
      } else if (!isLogin) {
        t = {
          flow: 'AuthFlow',
          initialRouteName: '온보딩화면',
          needsSignup,
        };
      } else if (isLogin && (familySetupSkipped || skipFamilyMainEntry)) {
        t = {flow: 'AppFlow', initialRouteName: 'Tabs', needsSignup};
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
          t = {
            flow: 'AuthFlow',
            initialRouteName: '전화번호인증화면',
            needsSignup,
          };
        } else if (p === SIGNUP_PROGRESS_STEP.PROFILE) {
          t = {
            flow: 'AuthFlow',
            initialRouteName: '약관동의화면',
            needsSignup,
          };
        } else if (
          p === SIGNUP_PROGRESS_STEP.FAMILY &&
          !serverPhoneVerifiedHint &&
          mmkvWantsPhoneScreenRaw
        ) {
          t = {
            flow: 'AuthFlow',
            initialRouteName: '전화번호인증화면',
            needsSignup,
          };
        } else if (p === SIGNUP_PROGRESS_STEP.FAMILY) {
          t = {
            flow: 'AuthFlow',
            initialRouteName: '설정완료화면',
            needsSignup,
          };
        } else if (p === SIGNUP_PROGRESS_STEP.FINISH) {
          t = {
            flow: 'AuthFlow',
            initialRouteName: '설정완료화면',
            needsSignup,
          };
        } else if (
          hasPendingSignupTerms &&
          (p == null || String(p).trim() === '')
        ) {
          t = {
            flow: 'AuthFlow',
            initialRouteName: '약관동의화면',
            needsSignup,
          };
        } else {
          t = {
            flow: 'AuthFlow',
            initialRouteName: '약관동의화면',
            needsSignup,
          };
        }
      } else if (mmkvWantsPhoneScreen) {
        t = {
          flow: 'AuthFlow',
          initialRouteName: '전화번호인증화면',
          needsSignup,
        };
      } else if (
        isLogin &&
        !needsSignup &&
        (user?.userId == null || user?.userId === '') &&
        !mmkvWantsPhoneScreen
      ) {
        // 토큰은 있는데 GET /user 일시 실패 등으로 user 슬라이스만 비어 있음 — 세션 유지, 탭에서 재조회
        t = {flow: 'AppFlow', initialRouteName: 'Tabs', needsSignup};
      } else if (effectiveHasFamily === true) {
        t = {flow: 'AppFlow', initialRouteName: 'Tabs', needsSignup};
      } else if (effectiveHasFamily === false) {
        // 가입 완료·로그인 O, 가족 미보유 — 약관으로 되돌리지 않고 메인 진입 (가족 없음 UX)
        t = {flow: 'AppFlow', initialRouteName: 'Tabs', needsSignup};
      } else {
        t = null;
      }
    }

    return t;
  }, [
    rehydrated,
    bootDone,
    authChecked,
    isLogin,
    skipFamilyMainEntry,
    serverPhoneVerifiedHint,
    user,
    mmkvVersion,
  ]);

  const effectiveHasFamilyForEffect = useMemo(() => {
    const mmkvRoute = getAuthRoutingMmkvSnapshotSync();
    const mmkvHasFamily = mmkvRoute.hasFamily;
    const derivedFamilyId = user?.familyId ?? null;
    return mmkvHasFamily != null
      ? mmkvHasFamily
      : authChecked && isLogin && user?.userId != null
      ? derivedFamilyId != null
      : null;
  }, [authChecked, isLogin, user, mmkvVersion]);

  hasFamilyRef.current = effectiveHasFamilyForEffect;

  useLayoutEffect(() => {
    if (!target || !navigationRef.isReady()) return;
    const nextFlow = target.flow;
    const root = navigationRef.getRootState?.();
    const idx = root?.index ?? 0;
    const currentRootName = root?.routes?.[idx]?.name ?? null;

    // prevFlow가 null인 첫 전환에서도 AuthFlow ↔ AppFlow가 확실히 전환되도록
    if (nextFlow === 'AppFlow' && currentRootName !== ROOT_MAIN_APP_SCREEN) {
      safeReset(getResetToMainAppFlowState('홈'));
    } else if (
      nextFlow === 'AuthFlow' &&
      currentRootName !== ROOT_AUTH_FLOW_SCREEN
    ) {
      safeReset({
        index: 0,
        routes: [{name: ROOT_AUTH_FLOW_SCREEN}],
      });
    }

    prevRootTargetFlowRef.current = nextFlow;
  }, [target]);

  // 콜드스타트: 이미 가족이 있는 유저로 확인되면 pending 코드 무시
  useEffect(() => {
    if (!authChecked || !isLogin || effectiveHasFamilyForEffect !== true) {
      return;
    }
    const pending = getPendingInviteCodeSync();
    if (pending) clearPendingInviteCode();
  }, [authChecked, isLogin, effectiveHasFamilyForEffect]);

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

  const rootStackInitialRoute =
    target.flow === 'AppFlow' ? ROOT_MAIN_APP_SCREEN : ROOT_AUTH_FLOW_SCREEN;

  return (
    <RootFlowStack.Navigator
      initialRouteName={rootStackInitialRoute}
      screenOptions={{headerShown: false, animationEnabled: false}}>
      <RootFlowStack.Screen
        name={ROOT_AUTH_FLOW_SCREEN}
        options={{animationEnabled: false}}>
        {() => (
          <AuthNavigator
            key={`AuthFlow:${isLogin}-${target.needsSignup}`}
            initialRouteName={
              target.flow === 'AuthFlow'
                ? target.initialRouteName
                : '온보딩화면'
            }
          />
        )}
      </RootFlowStack.Screen>
      <RootFlowStack.Screen
        name={ROOT_MAIN_APP_SCREEN}
        component={RootNavigator}
        options={{animationEnabled: false}}
      />
    </RootFlowStack.Navigator>
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
