import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';

export default function YellowSpinner() {
  const rotate = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 700,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [rotate, pulse]);

  const rotateInterpolate = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const scaleInterpolate = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.08],
  });

  const opacityInterpolate = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  return (
    <View style={styles.container}>
      {/* 배경 링 */}
      <View style={styles.backRing} />

      {/* 회전 링 */}
      <Animated.View
        style={[
          styles.spinRing,
          {
            transform: [{rotate: rotateInterpolate}, {scale: scaleInterpolate}],
            opacity: opacityInterpolate,
          },
        ]}
      />
    </View>
  );
}

const SIZE = 36;
const STROKE = 4;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backRing: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: STROKE,
    borderColor: '#FFE7B2',
  },

  spinRing: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: STROKE,
    borderColor: '#FFC84D',
    borderTopColor: 'transparent', // 핵심 포인트
    borderLeftColor: 'transparent',
  },
});
