import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

export default function YellowSpinner() {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.spinner,
        {
          transform: [{ rotate: spin }],
        },
      ]}
    />
  );
}

const SPINNER_SIZE = 40;

const styles = StyleSheet.create({
  spinner: {
    width: SPINNER_SIZE,
    height: SPINNER_SIZE,
    borderWidth: 4,
    borderColor: '#f3f3f3',
    borderTopColor: '#FFD700', // 노란색
    borderRadius: SPINNER_SIZE / 2,
    backgroundColor: 'transparent',
    alignSelf:'center',
    justifyContent:'center',
  },
});
