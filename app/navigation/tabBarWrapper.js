// components/TabBarWrapper.js
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomTabBar } from '@react-navigation/bottom-tabs';

export default function TabBarWrapper(props) {
  return (
    <SafeAreaView edges={['bottom']} style={{ backgroundColor: '#fff' }}>
      <BottomTabBar {...props} />
    </SafeAreaView>
  );
}
