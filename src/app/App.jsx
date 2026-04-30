import 'react-native-gesture-handler';
import 'react-native-reanimated';

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  Image,
  AppState,
  ActivityIndicator,
  Platform,
  StatusBar,
  Dimensions,
  Pressable,
  Alert,
} from 'react-native';
import {
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import {NavigationContainer} from '@react-navigation/native';
import {kinoverNavigationTheme} from './navigation/navigationTheme';
import {Provider, useDispatch, useSelector} from 'react-redux';
import {MenuProvider} from 'react-native-popup-menu';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import {KeyboardProvider} from 'react-native-keyboard-controller';
import LottieView from 'lottie-react-native';
import mmkvStorage from 'utils/mmkvStorage';
import * as Keychain from 'react-native-keychain';

import {
  deleteLoginInfo,
  setNeedsSignup,
  setHasFamily,
} from 'utils/storage';
import {setLogout, setAuthChecked} from 'features/auth/store/loginSlice';
import store, {persistor} from 'store';
import {PersistGate} from 'redux-persist/integration/react';
import RootScreen from './navigation/rootScreen';
import {
  navigationRef,
  flushPendingNavigation,
} from './navigation/navigationService';
import {
  checkAndAuthBiometricAppLock,
  getBiometricAvailability,
} from '../utils/biometrics';
import AppText from 'components/AppText';
import {useLogout} from 'features/auth/hooks/useLogout';
import {subscribeAccountBanned} from 'utils/accountBannedEvent';
import {subscribeSessionInvalidated} from 'utils/sessionInvalidatedEvent';
import useNetworkStatus, {registerReconnectCallback} from 'hooks/useNetworkStatus';
import {reconnectIfNeeded} from 'features/chat/hooks/ChatSocket';
import {
  hydrateBlockedUsersFromStorage,
  mergeServerBlockedUserIdsIntoCache,
} from 'features/moderation/store/blockedUsersSlice';
import {useLazyGetBlockedUsersQuery} from 'features/moderation/services/moderationApi';
import {AppStateResourceBridge} from './AppStateResourceBridge';
import {
  GuideOverlayProvider,
  GuideOverlayRoot,
} from '../contexts/GuideOverlayContext';
import {FONTS} from 'styles/typography';

const SPLASH_KEY = 'SPLASH_SHOWN_V1';
const SPLASH_KEYCHAIN_SERVICE = 'kinover.splash.once';
const ENABLE_APP_LOCK = false;

function KinoverSplashView({loop = false, onAnimationFinish}) {
  return (
    <View style={styles.splashContainer}>
      <Image
        source={require('../assets/images/kinover!!.png')}
        style={styles.logo}
      />
      <LottieView
        source={require('../assets/animations/kinoSplash_circle_expand.json')}
        autoPlay
        loop={loop}
        resizeMode="cover"
        style={styles.splashAnimation}
        onAnimationFinish={onAnimationFinish}
      />
    </View>
  );
}

/** 최초 설치 후 한 번만: 플래그는 App에서 읽기 직후 저장됨. 애니 종료·타임아웃으로 닫기 */
function SplashFirstRun({onFinish}) {
  const doneRef = useRef(false);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onFinish();
  }, [onFinish]);

  useEffect(() => {
    const t = setTimeout(() => finish(), 6000);
    return () => clearTimeout(t);
  }, [finish]);

  return <KinoverSplashView loop={false} onAnimationFinish={finish} />;
}

// 생체인식 잠금 — 백그라운드 갔다 오면 다시 인증 요구
function AccountBannedBridge() {
  const logout = useLogout();

  useEffect(() => {
    return subscribeAccountBanned(async message => {
      try {
        await logout();
      } catch {
        null;
      }
      const text =
        typeof message === 'string' && message.trim()
          ? message.trim()
          : '계정이 제재되어 이용할 수 없습니다.';
      Alert.alert('이용 제한', text);
    });
  }, [logout]);

  return null;
}

/** 409 중복 전화 / 403 ACCOUNT_INVALIDATED 등 — 로컬 세션 삭제 후 소셜 로그인(온보딩)으로 복귀 */
function SessionInvalidatedBridge() {
  const logout = useLogout();

  useEffect(() => {
    return subscribeSessionInvalidated(async payload => {
      try {
        await logout();
      } catch {
        null;
      }
      const text =
        typeof payload?.message === 'string' && payload.message.trim()
          ? payload.message.trim()
          : '다시 로그인해 주세요.';
      Alert.alert('안내', text, [{text: '확인'}]);
    });
  }, [logout]);

  return null;
}

function AppLockGate({readyForAuth}) {
  if (!ENABLE_APP_LOCK) return null;

  const bioOn = useSelector(state => !!state.ui?.bioLockEnabled);
  const rehydrated = useSelector(state => !!state?._persist?.rehydrated);

  const [locked, setLocked] = useState(false);
  const [authing, setAuthing] = useState(false);

  const authInFlightRef = useRef(false);
  const lastAppStateRef = useRef(AppState.currentState);
  const prevBioOnRef = useRef(false);
  const authSatisfiedRef = useRef(false);
  const startupAuthTriedRef = useRef(false);

  async function runAuth({force = false} = {}) {
    if (!bioOn) {
      authSatisfiedRef.current = false;
      setLocked(false);
      return;
    }

    if (!rehydrated || !readyForAuth) return;
    if (authSatisfiedRef.current && !force) {
      setLocked(false);
      return;
    }
    if (authInFlightRef.current) return;
    authInFlightRef.current = true;

    try {
      setLocked(true);
      setAuthing(true);

      const avail = await getBiometricAvailability();
      if (!avail?.available) {
        // 일시적인 센서 조회 실패에서 앱잠금 설정이 풀리지 않도록 유지
        setLocked(true);
        authSatisfiedRef.current = false;
        return;
      }

      const res = await checkAndAuthBiometricAppLock();

      if (res?.success) {
        setLocked(false);
        authSatisfiedRef.current = true;
      } else if (res?.reason === 'NOT_AVAILABLE') {
        // 생체 모듈 상태가 불안정한 경우에도 잠금을 자동 해제하지 않는다.
        setLocked(true);
        authSatisfiedRef.current = false;
      } else if (res?.requireLogout) {
        // 인증 실패/취소 시 자동 로그아웃하지 않고 잠금 상태를 유지한다.
        // 사용자가 오버레이를 탭해 생체인증을 다시 시도할 수 있게 한다.
        setLocked(true);
        authSatisfiedRef.current = false;
      } else {
        setLocked(true);
        authSatisfiedRef.current = false;
      }
    } finally {
      setAuthing(false);
      authInFlightRef.current = false;
    }
  }

  useEffect(() => {
    const wasOn = prevBioOnRef.current;
    const turnedOn = bioOn && !wasOn;
    const turnedOff = !bioOn && wasOn;
    prevBioOnRef.current = bioOn;

    if (!rehydrated || !readyForAuth) return;

    if (!bioOn) {
      if (turnedOff) {
        authSatisfiedRef.current = false;
        startupAuthTriedRef.current = false;
      }
      setLocked(false);
      return;
    }

    if (!startupAuthTriedRef.current) {
      startupAuthTriedRef.current = true;
      authSatisfiedRef.current = false;
      setLocked(true);
      runAuth({force: true});
      return;
    }

    if (turnedOn) {
      authSatisfiedRef.current = false;
      startupAuthTriedRef.current = true;
      runAuth({force: true});
      return;
    }

    runAuth();
  }, [bioOn, rehydrated, readyForAuth]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      const prev = lastAppStateRef.current;
      lastAppStateRef.current = nextState;

      if (
        prev === 'active' &&
        nextState === 'background'
      ) {
        authSatisfiedRef.current = false;
        startupAuthTriedRef.current = true;
        return;
      }

      if (prev === 'background' && nextState === 'active') {
        if (authInFlightRef.current) return;
        runAuth({force: true});
      }
    });

    return () => sub?.remove?.();
  }, [bioOn, rehydrated, readyForAuth]);

  if (!bioOn) return null;
  if (!rehydrated) return null;
  if (!readyForAuth) return null;
  if (!locked) return null;

  return (
    <View style={styles.lockOverlay} pointerEvents="auto">
      <ActivityIndicator size="large" color="#111827" />
      {!authing ? (
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={() => runAuth()}
          accessibilityRole="button"
          accessibilityLabel="잠금 해제 다시 시도">
          <View style={styles.lockRetryHint}>
            <AppText style={styles.lockRetryText}>탭하여 다시 시도</AppText>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

function NetworkStatusBridge() {
  const dispatch = useDispatch();
  useNetworkStatus({alertWhenOffline: true, alertWhenReconnected: true});
  useEffect(() => {
    const unregister = registerReconnectCallback(() => {
      reconnectIfNeeded();
    });
    return unregister;
  }, [dispatch]);
  return null;
}

/** MMKV 차단 ID → Redux + 로그인 시 GET /blocks 로 서버와 병합 */
function BlockedUsersReduxBridge() {
  const dispatch = useDispatch();
  const rehydrated = useSelector(state => !!state?._persist?.rehydrated);
  const rawUserId = useSelector(state => state?.user?.userId ?? state?.user?.id);
  const userKey =
    rawUserId != null && String(rawUserId).trim() !== ''
      ? String(rawUserId)
      : '';

  const [fetchBlockedUsers, fetchResult] = useLazyGetBlockedUsersQuery();

  useEffect(() => {
    if (!rehydrated) return;
    dispatch(hydrateBlockedUsersFromStorage());
  }, [rehydrated, userKey, dispatch]);

  useEffect(() => {
    if (!rehydrated || !userKey) return;
    void fetchBlockedUsers(userKey);
  }, [rehydrated, userKey, fetchBlockedUsers]);

  const {data, isSuccess, fulfilledTimeStamp} = fetchResult;

  useEffect(() => {
    if (!userKey) return;
    if (!isSuccess || data == null) return;
    void dispatch(mergeServerBlockedUserIdsIntoCache(data));
  }, [userKey, isSuccess, data, fulfilledTimeStamp, dispatch]);

  return null;
}

// 개발용: rehydration 이후에 “저장소 + redux-persist”까지 싹 정리
const DEV_FORCE_RESET_LOGIN_ONCE = false;

function DevForceResetLogin() {
  const dispatch = useDispatch();
  const rehydrated = useSelector(state => !!state?._persist?.rehydrated);
  const didRef = useRef(false);

  useEffect(() => {
    if (!__DEV__) return;
    if (!DEV_FORCE_RESET_LOGIN_ONCE) return;
    if (!rehydrated) return;
    if (didRef.current) return;
    didRef.current = true;
 // 로그인 초기화 테스트할 때 위 플래그 true로 바꿔서 씀
    (async () => {
      try {

        await persistor.purge();

 // 1) Keychain/MMKV login 관련 제거
        await deleteLoginInfo();

 // 2) signup 플래그 정리
        await setNeedsSignup(false);
        await setHasFamily(null);

 // 3) redux state 정리
        dispatch(setLogout());
        dispatch(setAuthChecked(true));

      } catch (e) {
        dispatch(setLogout());
        dispatch(setAuthChecked(true));
      }
    })();
  }, [dispatch, rehydrated]);

  return null;
}

// ==================== Main ====================

// 나중에 다크모드 켜면 여기서 바꿀 거
export default function App() {
  const [splashHydrated, setSplashHydrated] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const isDarkMode = false;

  useEffect(() => {
    (async () => {
      try {
        const shownFromMMKV = await mmkvStorage.getItem(SPLASH_KEY);
        let shown = shownFromMMKV === '1';

        // MMKV 플래그가 비어 있어도 키체인 플래그가 있으면 1회 노출 완료로 간주
        if (!shown) {
          try {
            const creds = await Keychain.getInternetCredentials(
              SPLASH_KEYCHAIN_SERVICE,
            );
            shown = !!creds && creds.password === '1';
          } catch {
            null;
          }
        }

        if (shown) {
          setShowSplash(false);
          setSplashDone(true);
        } else {
          await mmkvStorage.setItem(SPLASH_KEY, '1');
          try {
            await Keychain.setInternetCredentials(
              SPLASH_KEYCHAIN_SERVICE,
              'shown',
              '1',
            );
          } catch {
            null;
          }
          setShowSplash(true);
          setSplashDone(false);
        }
      } catch {
        setShowSplash(false);
        setSplashDone(true);
      } finally {
        setSplashHydrated(true);
      }
    })();
  }, []);

  const onSplashFinish = useCallback(() => {
    setSplashDone(true);
    setShowSplash(false);
  }, []);

  const readyForAuth =
    splashHydrated && (!showSplash || splashDone);

  return (
    <GestureHandlerRootView style={styles.root}>
      {/* Android StatusBar 설정 (투명 + translucent) */}
      {Platform.OS === 'android' && (
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        />
      )}

      <SafeAreaProvider>
        <KeyboardProvider navigationBarTranslucent={Platform.OS === 'android'}>
          <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
              <BottomSheetModalProvider>
                <DevForceResetLogin />
                <NetworkStatusBridge />
                <BlockedUsersReduxBridge />
                <AppStateResourceBridge />
                <AccountBannedBridge />
                <SessionInvalidatedBridge />

                <MenuProvider>
                  <NavigationContainer
                    theme={kinoverNavigationTheme}
                    ref={navigationRef}
                    onReady={() => {
                      flushPendingNavigation();
                    }}>
                    {!splashHydrated ? (
                      <View style={styles.splashGatePlaceholder} />
                    ) : showSplash && !splashDone ? (
                      <SplashFirstRun onFinish={onSplashFinish} />
                    ) : (
                      <GuideOverlayProvider>
                        <View style={styles.guideRootWrap}>
                          <View style={styles.mainContent}>
                            <RootScreen />
                          </View>
                          <View style={styles.guideOverlayWrap} pointerEvents="box-none">
                            <GuideOverlayRoot />
                          </View>
                          <AppLockGate readyForAuth={readyForAuth} />
                        </View>
                      </GuideOverlayProvider>
                    )}

                  </NavigationContainer>
                </MenuProvider>
              </BottomSheetModalProvider>
            </PersistGate>
          </Provider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// ==================== Styles ====================

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF', // 투명 시스템바 뒤로 하얀 띠 비치는 것 방지
  },
  splashGatePlaceholder: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  guideRootWrap: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
  },
  guideOverlayWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    // Android(Pixel 등): 탭 바·소프트키 영역까지 덮도록 전체 화면 높이 사용
    height: Dimensions.get('screen').height,
    zIndex: 99998,
    elevation: 99998,
  },

  splashContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },

  logo: {
    position: 'absolute',
    width: 180,
    height: 180,
    bottom: '41.5%',
    right: '31.5%',
    resizeMode: 'contain',
  },

  splashAnimation: {
    width: '100%',
    height: '100%',
  },

  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.97)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockRetryHint: {
    position: 'absolute',
    bottom: '20%',
    alignSelf: 'center',
  },
  lockRetryText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: FONTS.REGULAR,
  },
});
