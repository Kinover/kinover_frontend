import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

export default function YellowSpinner() {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 안쪽 원만 커졌다 작아졌다 하는 애니메이션
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.25,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [scaleAnim]);

  return (
    <View style={styles.container}>
      {/* 바깥 레이어 (제일 연한 노랑) */}
      <View style={styles.outerCircle} />
      {/* 중간 레이어 */}
      <View style={styles.middleCircle} />
      {/* 안쪽 레이어 (스피너) */}
      <Animated.View
        style={[
          styles.innerCircle,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      />
    </View>
  );
}

const SIZE = 40;
const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerCircle: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: '#FFEEC0',
  },
  middleCircle: {
    position: 'absolute',
    width: SIZE * 0.7,
    height: SIZE * 0.7,
    borderRadius: (SIZE * 0.7) / 2,
    backgroundColor: '#FFD970',
  },
  innerCircle: {
    position: 'absolute',
    width: SIZE * 0.35,
    height: SIZE * 0.35,
    borderRadius: (SIZE * 0.35) / 2, // ← 이게 맞음!
    backgroundColor: '#FFC84D',
  },
});
