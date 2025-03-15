import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import MyApp from './app/_layout.jsx'; // 네비게이터 컴포넌트
import {enableScreens} from 'react-native-screens';
import {SafeAreaProvider} from 'react-native-safe-area-context';

enableScreens();

export default function App() {
  return (
    <SafeAreaProvider>
        <MyApp />
    </SafeAreaProvider>
  );
}
