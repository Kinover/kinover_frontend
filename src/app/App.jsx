// src/app/App.jsx
import 'react-native-gesture-handler';
import 'react-native-reanimated';

import React, {useEffect, useRef, useState, useCallback} from 'react';
import {
  View,
  StyleSheet,
  Image,
  Text,
  TextInput,
  AppState,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import {
  GestureHandlerRootView,
  TextInput as GHTextInput,
} from 'react-native-gesture-handler';
import {NavigationContainer} from '@react-navigation/native';
import {Provider, useDispatch, useSelector} from 'react-redux';
import {MenuProvider} from 'react-native-popup-menu';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import LottieView from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  deleteLoginInfo,
  disableGuestMode,
  setNeedsSignup,
  setHasFamily,
} from 'utils/storage';
import {setLogout, setAuthChecked} from 'features/auth/store/loginSlice';

import store, {persistor} from 'store';
import {PersistGate} from 'redux-persist/integration/react';
import RootScreen from './navigation/rootScreen';
import {navigationRef, flushPendingNavigation} from './navigation/navigationService';
import {setResponsiveMode} from 'utils/responsive';

import {
  checkAndAuthBiometric,
  getBiometricAvailability,
} from '../utils/biometrics';
import {setBioLockEnabled} from 'store/uiSlice';

if (Text.defaultProps == null) Text.defaultProps = {};
Text.defaultProps.allowFontScaling = false;
if (TextInput.defaultProps == null) TextInput.defaultProps = {};
TextInput.defaultProps.allowFontScaling = false;
if (GHTextInput?.defaultProps == null) GHTextInput.defaultProps = {};
GHTextInput.defaultProps.allowFontScaling = false;

function ResponsiveModeBridge() {
  const fontMode = useSelector(state => state.ui?.fontMode);
  useEffect(() => {
    if (fontMode != null) setResponsiveMode(fontMode);
  }, [fontMode]);
  return null;
}

const SPLASH_KEY = 'SPLASH_SHOWN_V1';

function AppLockGate({readyForAuth}) {
  const dispatch = useDispatch();
  const bioOn = useSelector(state => !!state.ui?.bioLockEnabled);
  const rehydrated = useSelector(state => !!state?._persist?.rehydrated);

  const [locked, setLocked] = useState(false);
  const [authing, setAuthing] = useState(false);

  const authInFlightRef = useRef(false);
  const lastAppStateRef = useRef(AppState.currentState);
  const authedThisSessionRef = useRef(false);
  const didInitialAuthRef = useRef(false);

  const runAuth = useCallback(async () => {
    if (!bioOn) {
      setLocked(false);
      authedThisSessionRef.current = true;
      return;
    }
    if (!rehydrated) return;
    if (!readyForAuth) return;

    if (authedThisSessionRef.current) {
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
        dispatch(setBioLockEnabled(false));
        setLocked(false);
        authedThisSessionRef.current = true;
        return;
      }

      const res = await checkAndAuthBiometric();

      if (res?.success) {
        setLocked(false);
        authedThisSessionRef.current = true;
      } else {
        setLocked(true);
        authedThisSessionRef.current = false;
      }
    } finally {
      setAuthing(false);
      authInFlightRef.current = false;
    }
  }, [bioOn, rehydrated, readyForAuth, dispatch]);

  useEffect(() => {
    if (didInitialAuthRef.current) return;
    didInitialAuthRef.current = true;
    runAuth();
  }, [runAuth]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      const prev = lastAppStateRef.current;
      lastAppStateRef.current = nextState;

      if (prev === 'active' && nextState === 'background') {
        authedThisSessionRef.current = false;
        return;
      }

      if (prev === 'background' && nextState === 'active') {
        runAuth();
      }
    });

    return () => sub?.remove?.();
  }, [runAuth]);

  if (!bioOn) return null;
  if (!rehydrated) return null;
  if (!readyForAuth) return null;
  if (!locked) return null;

  return (
    <View style={styles.lockOverlay} pointerEvents="auto">
      <View style={styles.lockCard}>
        <Text allowFontScaling={false} style={styles.lockTitle}>
          앱 잠금
        </Text>
        <Text allowFontScaling={false} style={styles.lockDesc}>
          생체인식으로 잠금을 해제해줘요
        </Text>
        <View style={{height: 16}} />
        {authing ? (
          <ActivityIndicator size="small" color="#111827" />
        ) : (
          <Text allowFontScaling={false} style={styles.lockHint}>
            화면을 잠시 터치하면 다시 시도해요
          </Text>
        )}
      </View>

      {!authing ? (
        <View
          style={StyleSheet.absoluteFillObject}
          onStartShouldSetResponder={() => true}
          onResponderRelease={() => runAuth()}
        />
      ) : null}
    </View>
  );
}

// ✅ 개발용: rehydration 이후에 “저장소 + redux-persist”까지 싹 정리
const DEV_FORCE_RESET_LOGIN_ONCE = true;

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

    (async () => {
      try {
        console.log('🧹 [DEV] force reset start');

        // ✅ 0) redux-persist 저장 자체 purge (핵심!)
        await persistor.purge();

        // ✅ 1) Keychain/AsyncStorage login 관련 제거
        await deleteLoginInfo();

        // ✅ 2) guest/signup 플래그 정리
        await disableGuestMode();
        await setNeedsSignup(false);
        await setHasFamily(null);

        // ✅ 3) redux state 정리
        dispatch(setLogout());
        dispatch(setAuthChecked(true));

        console.log('✅ [DEV] force reset done');
      } catch (e) {
        console.log('❌ [DEV] force reset error:', e?.message);
        dispatch(setLogout());
        dispatch(setAuthChecked(true));
      }
    })();
  }, [dispatch, rehydrated]);

  return null;
}

export default function App() {
  const [isSplashFinished, setIsSplashFinished] = useState(false);
  const [shouldShowSplash, setShouldShowSplash] = useState(false);

  // ✅ (선택) 다크모드 여부를 상태로 관리하고 있으면 여기에 연결
  // const isDarkMode = useColorScheme() === 'dark';
  const isDarkMode = false;

  useEffect(() => {
    (async () => {
      try {
        const shown = await AsyncStorage.getItem(SPLASH_KEY);
        if (shown === '1') {
          setShouldShowSplash(false);
          setIsSplashFinished(true);
        } else {
          setShouldShowSplash(true);
          setIsSplashFinished(false);
        }
      } catch {
        setShouldShowSplash(false);
        setIsSplashFinished(true);
      }
    })();
  }, []);

  const onSplashFinish = async () => {
    setIsSplashFinished(true);
    setShouldShowSplash(false);
    try {
      await AsyncStorage.setItem(SPLASH_KEY, '1');
    } catch {
      null;
    }
  };

  const readyForAuth = !shouldShowSplash || isSplashFinished;

  return (
    <GestureHandlerRootView style={styles.root}>
      {/* ✅ 요즘 패턴 핵심 1: StatusBar를 투명 + translucent */}
      {Platform.OS === 'android' && (
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        />
      )}

      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
              <DevForceResetLogin />
              <ResponsiveModeBridge />

              <MenuProvider>
                <NavigationContainer
                  ref={navigationRef}
                  onReady={() => flushPendingNavigation()}>
                  {shouldShowSplash && !isSplashFinished ? (
                    <View style={styles.splashContainer}>
                      <Image
                        source={require('../assets/images/kinover!!.png')}
                        style={styles.logo}
                      />
                      <LottieView
                        source={require('../assets/animations/kinoSplash_circle_expand.json')}
                        autoPlay
                        loop={false}
                        resizeMode="cover"
                        style={styles.splashAnimation}
                        onAnimationFinish={onSplashFinish}
                      />
                    </View>
                  ) : (
                    <RootScreen />
                  )}

                  <AppLockGate readyForAuth={readyForAuth} />
                </NavigationContainer>
              </MenuProvider>
            </PersistGate>
          </Provider>
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    // ✅ 루트 배경을 명확히: 투명 시스템바 뒤로 "하얀 띠" 비치는 걸 줄여줌
    backgroundColor: '#FFFFFF',
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
  splashAnimation: {width: '100%', height: '100%'},

  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockCard: {
    width: '78%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.08)',
  },
  lockTitle: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 16,
    color: '#111827',
    letterSpacing: -0.2,
  },
  lockDesc: {
    marginTop: 6,
    fontFamily: 'Pretendard-Regular',
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  lockHint: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 12.5,
    color: '#374151',
  },
});
