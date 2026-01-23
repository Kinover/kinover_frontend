// src/app/App.jsx
import 'react-native-gesture-handler';
import 'react-native-reanimated';

import React, {useEffect, useState} from 'react';
import {View, StyleSheet, Image, Text, TextInput} from 'react-native';
import {
  GestureHandlerRootView,
  TextInput as GHTextInput,
} from 'react-native-gesture-handler';
import {NavigationContainer} from '@react-navigation/native';
import {Provider, useSelector} from 'react-redux';
import {MenuProvider} from 'react-native-popup-menu';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import LottieView from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import store, {persistor} from 'store';
import {PersistGate} from 'redux-persist/integration/react';
import RootScreen from './navigation/rootScreen';
import {
  navigationRef,
  flushPendingNavigation,
} from './navigation/navigationService';
import {setResponsiveMode} from 'utils/responsive';

// ✅ 폰트 스케일링 기본 off
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

// 네가 쓰던 스플래시 1회 로직 유지
const SPLASH_KEY = 'SPLASH_SHOWN_V1';

export default function App() {
  const [isSplashFinished, setIsSplashFinished] = useState(false);
  const [shouldShowSplash, setShouldShowSplash] = useState(false);

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
      } catch (e) {
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
    } catch (e) {
      null;
    }
  };

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
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
                    // ✅ 여기서 분기 절대 하지 말고, 무조건 AppNavigator로
                    <RootScreen />
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

const styles = StyleSheet.create({
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
});
