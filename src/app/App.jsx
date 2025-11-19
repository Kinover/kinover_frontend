// src/app/App.tsx
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import React, {useState} from 'react';
import {View, StyleSheet, Image} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {Provider} from 'react-redux';
import {MenuProvider} from 'react-native-popup-menu';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import LottieView from 'lottie-react-native';

import store from 'store/store';
import ChatSettings from 'features/chat/screens/chatSetting';
import { navigationRef } from './navigation/navigationRef';
import { AppNavigator } from './navigation';

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
                <>
                  <ChatSettings
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                  />
                  <NavigationContainer ref={navigationRef}>
                    <AppNavigator setIsSettingsOpen={setIsSettingsOpen} />
                  </NavigationContainer>
                </>
              ) : (
                <View style={styles.splashContainer}>
                  <Image
                    source={require('@/assets/images/kinover.png')}
                    style={{
                      position: 'absolute',
                      top: '35.9%',
                      left: '26.7%',
                      width: '35%',
                      height: '22%',
                      resizeMode: 'contain',
                    }}
                  />
                  <LottieView
                    source={require('@/assets/animations/kinoSplash_circle_expand.json')}
                    autoPlay
                    loop={false}
                    resizeMode="cover"
                    style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      top: 0,
                      left: 0,
                    }}
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
});
