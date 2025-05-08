import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import MyApp from './app/_layout.jsx';
import {enableScreens} from 'react-native-screens';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import 'react-native-get-random-values';

enableScreens();

export default function App() {
  return (
    <SafeAreaProvider>
        <MyApp />
    </SafeAreaProvider>
  );
}
