// components/TabBarWrapper.js
import React from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {BottomTabBar} from '@react-navigation/bottom-tabs';

export default function TabBarWrapper(props) {
  return (
    <View style={{flex:1, backgroundColor: 'white'}}>
      <BottomTabBar {...props} />
    </View>
  );
}
