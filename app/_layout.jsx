import React, {useState} from 'react';
import {Provider} from 'react-redux';
import {NavigationContainer} from '@react-navigation/native';
import {MenuProvider} from 'react-native-popup-menu';

import store from './redux/store';
// import {AppNavigator} from './navigation';
import { AppNavigator } from './navigation';
import ChatSettings from './screens/communication/chatRoom/setting/chatSetting';

export default function MyApp() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <Provider store={store}>
      <MenuProvider>
        <ChatSettings
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
        <NavigationContainer>
          <AppNavigator setIsSettingsOpen={setIsSettingsOpen} />
        </NavigationContainer>
      </MenuProvider>
    </Provider>
  );
}
