import 'react-native-gesture-handler';
import 'react-native-reanimated';

import React, {useEffect, useRef, useState} from 'react';
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
  Dimensions,
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
import {
  navigationRef,
  flushPendingNavigation,
} from './navigation/navigationService';
import {setResponsiveMode} from 'utils/responsive';
import {
  checkAndAuthBiometric,
  getBiometricAvailability,
} from '../utils/biometrics';
import {FONT_MODE, setBioLockEnabled} from 'store/uiSlice';
import useNetworkStatus, {registerReconnectCallback} from 'hooks/useNetworkStatus';
import {reconnectIfNeeded} from 'features/chat/hooks/ChatSocket';
import {AppStateResourceBridge} from './AppStateResourceBridge';
import {
  GuideOverlayProvider,
  GuideOverlayRoot,
} from '../contexts/GuideOverlayContext';

// ==================== Font Scaling Disable ====================

if (Text.defaultProps == null) {
  Text.defaultProps = {};
}
Text.defaultProps.allowFontScaling = false;

if (TextInput.defaultProps == null) {
  TextInput.defaultProps = {};
}
TextInput.defaultProps.allowFontScaling = false;

if (GHTextInput?.defaultProps == null) {
  GHTextInput.defaultProps = {};
}
GHTextInput.defaultProps.allowFontScaling = false;

const SPLASH_KEY = 'SPLASH_SHOWN_V1';

const FONT_MODE_SCALE = {
  [FONT_MODE.NORMAL]: 1,
  [FONT_MODE.LARGE]: 1.08,
  [FONT_MODE.EXTRA_LARGE]: 1.16,
};

const ONBOARDING_ROUTE_NAME = '온보딩화면';

let latestFontMode = FONT_MODE.NORMAL;
let globalTextScale = 1;
let textRenderPatched = false;

const isStyleObject = value =>
  value != null && typeof value === 'object' && !Array.isArray(value);

const scaleTextStyle = style => {
  if (!style || globalTextScale === 1) return style;

  if (Array.isArray(style)) return style.map(scaleTextStyle);
  if (!isStyleObject(style)) return style;

  const hasMetric =
    typeof style.fontSize === 'number' ||
    typeof style.lineHeight === 'number' ||
    typeof style.letterSpacing === 'number';

  if (!hasMetric) return style;

  const next = {...style};
  if (typeof style.fontSize === 'number') next.fontSize = style.fontSize * globalTextScale;
  if (typeof style.lineHeight === 'number') next.lineHeight = style.lineHeight * globalTextScale;
  if (typeof style.letterSpacing === 'number') {
    next.letterSpacing = style.letterSpacing * globalTextScale;
  }
  return next;
};

const patchTextRenderOnce = () => {
  if (textRenderPatched) return;
  if (typeof Text?.render !== 'function') return;

  const originalRender = Text.render;
  Text.render = function patchedTextRender(...args) {
    const element = originalRender.apply(this, args);
    if (!React.isValidElement(element)) return element;
    if (globalTextScale === 1) return element;

    const originalStyle = element?.props?.style;
    if (!originalStyle) return element;

    const scaledStyle = scaleTextStyle(originalStyle);
    if (scaledStyle === originalStyle) return element;
    return React.cloneElement(element, {style: scaledStyle});
  };

  textRenderPatched = true;
};

const resolveTextScale = (fontMode, routeName) => {
  if (routeName === ONBOARDING_ROUTE_NAME) return 1;
  return FONT_MODE_SCALE[fontMode] ?? 1;
};

const applyGlobalTextScale = (fontMode, routeName) => {
  patchTextRenderOnce();
  globalTextScale = resolveTextScale(fontMode, routeName);
};

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

function ResponsiveModeBridge() {
  const fontMode = useSelector(state => state.ui?.fontMode);

  useEffect(() => {
    if (fontMode != null) {
      setResponsiveMode(fontMode);
      latestFontMode = fontMode;
      const routeName = navigationRef?.getCurrentRoute?.()?.name;
      applyGlobalTextScale(fontMode, routeName);
    }
  }, [fontMode]);

  return null;
}

// 생체인식 잠금 — 백그라운드 갔다 오면 다시 인증 요구
function AppLockGate({readyForAuth}) {
  const dispatch = useDispatch();
  const bioOn = useSelector(state => !!state.ui?.bioLockEnabled);
  const rehydrated = useSelector(state => !!state?._persist?.rehydrated);

  const [locked, setLocked] = useState(false);
  const [authing, setAuthing] = useState(false);

  const authInFlightRef = useRef(false);
  const lastAppStateRef = useRef(AppState.currentState);
  const authedThisSessionRef = useRef(false);

  async function runAuth() {
    if (!bioOn) {
      setLocked(false);
      authedThisSessionRef.current = true;
      return;
    }

    if (!rehydrated || !readyForAuth) return;
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
  }

  useEffect(() => {
    if (!bioOn || !rehydrated || !readyForAuth) return;
    if (authedThisSessionRef.current) return;
    runAuth();
  }, [bioOn, rehydrated, readyForAuth]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      const prev = lastAppStateRef.current;
      lastAppStateRef.current = nextState;

      if (
        prev === 'active' &&
        (nextState === 'background' || nextState === 'inactive')
      ) {
        authedThisSessionRef.current = false;
        return;
      }

      if (
        (prev === 'background' || prev === 'inactive') &&
        nextState === 'active'
      ) {
        runAuth();
      }
    });

    return () => sub?.remove?.();
  }, [bioOn, rehydrated, readyForAuth]);

  if (!bioOn) return null;
  if (!rehydrated) return null;
  if (!readyForAuth) return null;
  if (!locked) return null;

  if (authing) {
    return (
      <View style={styles.lockOverlay} pointerEvents="auto">
        <KinoverSplashView loop={true} />
      </View>
    );
  }

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
        console.log('🧹 [DEV] force reset start');

        await persistor.purge();

 // 1) Keychain/AsyncStorage login 관련 제거
        await deleteLoginInfo();

 // 2) guest/signup 플래그 정리
        await disableGuestMode();
        await setNeedsSignup(false);
        await setHasFamily(null);

 // 3) redux state 정리
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

// ==================== Main ====================

// 나중에 다크모드 켜면 여기서 바꿀 거
export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const isDarkMode = false;

  useEffect(() => {
    (async () => {
      try {
        const shown = await AsyncStorage.getItem(SPLASH_KEY);
        if (shown === '1') {
          setShowSplash(false);
          setSplashDone(true);
        } else {
          setShowSplash(true);
          setSplashDone(false);
        }
      } catch {
        setShowSplash(false);
        setSplashDone(true);
      }
    })();
  }, []);

  const onSplashFinish = async () => {
    setSplashDone(true);
    setShowSplash(false);
    try {
      await AsyncStorage.setItem(SPLASH_KEY, '1');
    } catch (e) {
      null;
    }
  };

  const readyForAuth = !showSplash || splashDone;

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
        <BottomSheetModalProvider>
          <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
              <DevForceResetLogin />
              <ResponsiveModeBridge />
              <NetworkStatusBridge />
              <AppStateResourceBridge />

              <MenuProvider>
                <NavigationContainer
                  ref={navigationRef}
                  onReady={() => {
                    const routeName = navigationRef?.getCurrentRoute?.()?.name;
                    applyGlobalTextScale(latestFontMode, routeName);
                    flushPendingNavigation();
                  }}
                  onStateChange={() => {
                    const routeName = navigationRef?.getCurrentRoute?.()?.name;
                    applyGlobalTextScale(latestFontMode, routeName);
                  }}>
                  {showSplash && !splashDone ? (
                    <KinoverSplashView
                      loop={false}
                      onAnimationFinish={onSplashFinish}
                    />
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
            </PersistGate>
          </Provider>
        </BottomSheetModalProvider>
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
