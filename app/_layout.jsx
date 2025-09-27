import {GestureHandlerRootView} from 'react-native-gesture-handler';

import React, {useState, useEffect} from 'react';
import {View, StyleSheet, Image, Dimensions} from 'react-native';
import {Provider} from 'react-redux';
import {NavigationContainer} from '@react-navigation/native';
import {MenuProvider} from 'react-native-popup-menu';
import store from './redux/store';
import LottieView from 'lottie-react-native';

import ChatSettings from './screens/communication/chatRoom/setting/chatSetting';
import {navigationRef} from './navigation/navigationRef';
import {BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import { AppNavigator } from './navigation';

export default function MyApp() {
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
                    source={require('./assets/images/kinover.png')}
                    style={{
                      position: 'absolute',
                      top: '35.9%',
                      left: '26.7%',
                      width: '35%',
                      height: '22%',
                      resizeMode: 'contain',
                    }}></Image>
                  <LottieView
                    source={require('./assets/animations/kinoSplash_circle_expand.json')}
                    autoPlay
                    loop={false}
                    resizeMode="cover" // 이걸 꼭 넣어줘야 꽉 채움
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
    backgroundColor: '#FFFFFF', // 원하는 배경색
  },
});
