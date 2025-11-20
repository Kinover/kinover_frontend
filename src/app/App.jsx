// src/app/App.jsx

import {GestureHandlerRootView} from 'react-native-gesture-handler';
import React, {useState} from 'react';
import {View, StyleSheet, Image} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {Provider} from 'react-redux';
import {MenuProvider} from 'react-native-popup-menu';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import LottieView from 'lottie-react-native';

// ⬇️ 지윤 alias 쓰고 싶으면 이걸로
// import store from '@/store/store';

// ⬇️ alias 못 쓰면 이걸로 (확실하게 동작함)
import store from '../store/store';

import ChatSettings from '../features/chat/screens/chatSetting';
import {navigationRef} from './navigation/navigationRef';
import AppNavigator from './navigation/appNavigator';

export default function App() {
  const [isSplashFinished, setIsSplashFinished] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <Provider store={store}>
            <MenuProvider>
              {isSplashFinished ? (
                <NavigationContainer ref={navigationRef}>
                  <ChatSettings
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                  />
                  <AppNavigator setIsSettingsOpen={setIsSettingsOpen} />
                </NavigationContainer>
              ) : (
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
                    onAnimationFinish={() => setIsSplashFinished(true)}
                  />
                </View>
              )}
            </MenuProvider>
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
  splashAnimation: {
    width: '100%',
    height: '100%',
  },
});
