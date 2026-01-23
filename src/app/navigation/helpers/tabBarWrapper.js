// components/TabBarWrapper.js
import React from 'react';
import { Platform,View,StyleSheet } from 'react-native';
import {BottomTabBar} from '@react-navigation/bottom-tabs';

export default function TabBarWrapper(props) {
  return (
    <>
      <View style={{backgroundColor: '#F9F9F9'}} edges={['bottom']}>
        <BottomTabBar {...props} />
        <View style={styles.shadowTop} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  shadowTop: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: '#fff', // 배경 안 보이게
    zIndex: -1,
    ...Platform.select({
      ios: {
        shadowColor: 'black',
        shadowOffset: {width: 0, height: -0}, // 위로 퍼지게
        shadowOpacity: 0.6,
        shadowRadius: 7,
      },
      android: {
        elevation: 8, // 위쪽만 강조
      },
    }),
  },
});
