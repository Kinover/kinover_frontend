import React, {useEffect, useMemo} from 'react';
import {View, StyleSheet, Pressable} from 'react-native';
import {GestureDetector, Gesture} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

import {
  getResponsiveHeight,
  getResponsiveWidth,
} from 'utils/responsive';
import {COLORS} from 'styles/style';

/**
 * 3-step slider (0|1|2)
 * - 스타일: 활성(파랑) / 비활성(회색) + 흰 구멍(스텝 점) + 큰 파란 thumb
 */
export function FontModeSliderBlue({
  value, // 0|1|2
  onComplete, // (step) => void
}) {
  // ---------- size tokens (이미지 느낌 비율) ----------
  const TRACK_W = getResponsiveWidth(300);
  const TRACK_H = getResponsiveHeight(18); // 트랙이 “두툼한 바” 느낌
  const THUMB = getResponsiveWidth(25); // 엄지 큰 원
  const HOLE = getResponsiveWidth(10); // 트랙의 흰 구멍
  const PADDING = getResponsiveWidth(8); // 트랙 안쪽 여백

  // thumb가 움직일 수 있는 실제 범위
  const RANGE = TRACK_W - THUMB;
  const STEP = RANGE / 2; // 0,1,2니까 2칸

  // shared
  const tx = useSharedValue(STEP * value);
  const startX = useSharedValue(tx.value);

  // 외부 value 바뀌면 스냅 위치 동기화
  useEffect(() => {
    tx.value = withTiming(STEP * value, {duration: 180});
  }, [value, STEP, tx]);

  // ---------- animated styles ----------
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{translateX: tx.value}],
  }));

  const leftStyle = useAnimatedStyle(() => {
    // 왼쪽 활성 트랙 길이: thumb 중심까지만 칠해주면 이미지처럼 자연스러움
    const w = tx.value + THUMB / 2;
    return {width: w};
  });

  // ---------- gesture (worklet 안전: JS 함수 호출 금지) ----------
  const pan = useMemo(() => {
    return Gesture.Pan()
      .onBegin(() => {
        startX.value = tx.value;
      })
      .onUpdate(e => {
        const next = startX.value + e.translationX;
        const clamped = Math.min(Math.max(next, 0), RANGE);
        tx.value = clamped;
      })
      .onEnd(() => {
        const raw = tx.value / STEP;
        const step = Math.min(Math.max(Math.round(raw), 0), 2);
        const snapX = STEP * step;

        tx.value = withTiming(snapX, {duration: 180});

        if (onComplete) runOnJS(onComplete)(step);
      });
  }, [RANGE, STEP, onComplete, startX, tx]);

  // ---------- tap to jump (점/트랙 눌러 스텝 이동) ----------
  const jumpTo = step => {
    const s = Math.min(Math.max(step, 0), 2);
    tx.value = withTiming(STEP * s, {duration: 180});
    onComplete?.(s);
  };

  return (
    <View style={styles.wrap}>
      <View style={[styles.trackWrap, {width: TRACK_W, height: THUMB}]}>
        {/* 트랙 배경(회색) */}
        <View
          style={[
            styles.trackBase,
            {
              width: TRACK_W,
              height: TRACK_H,
              borderRadius: TRACK_H / 2,
              top: (THUMB - TRACK_H) / 2,
              paddingHorizontal: PADDING,
            },
          ]}
        />

        {/* 활성 트랙(파랑) */}
        <Animated.View
          style={[
            styles.trackActive,
            {
              height: TRACK_H,
              borderRadius: TRACK_H / 2,
              top: (THUMB - TRACK_H) / 2,
              left: 0,
            },
            leftStyle,
          ]}
        />

        {/* 흰 구멍 3개 (트랙 가운데 정렬) */}
        <View
          pointerEvents="none"
          style={[
            styles.holeRow,
            {
              width: TRACK_W,
              height: TRACK_H,
              top: (THUMB - TRACK_H) / 2,
              paddingHorizontal: PADDING,
            },
          ]}>
          <View
            style={[
              styles.hole,
              {width: HOLE, height: HOLE, borderRadius: HOLE / 2},
            ]}
          />
          <View
            style={[
              styles.hole,
              {width: HOLE, height: HOLE, borderRadius: HOLE / 2},
            ]}
          />
          <View
            style={[
              styles.hole,
              {width: HOLE, height: HOLE, borderRadius: HOLE / 2},
            ]}
          />
        </View>

        {/* 트랙/점 탭해서 점프 (사용자 경험 좋아짐) */}
        <View style={[styles.tapRow, {width: TRACK_W, height: THUMB}]}>
          <Pressable style={styles.tapZone} onPress={() => jumpTo(0)} />
          <Pressable style={styles.tapZone} onPress={() => jumpTo(1)} />
          <Pressable style={styles.tapZone} onPress={() => jumpTo(2)} />
        </View>

        {/* thumb (큰 파란 원) */}
        <GestureDetector gesture={pan}>
          <Animated.View
            style={[
              styles.thumb,
              {
                width: THUMB,
                height: THUMB,
                borderRadius: THUMB / 2,
              },
              thumbStyle,
            ]}
          />
        </GestureDetector>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  trackWrap: {
    position: 'relative',
    justifyContent: 'center',
  },

  trackBase: {
    position: 'absolute',
    left: 0,
    backgroundColor: '#E5E7EB', // 회색
  },

  trackActive: {
    position: 'absolute',
    backgroundColor: COLORS.brandPrimary, // 파랑(이미지 느낌)
  },

  holeRow: {
    position: 'absolute',
    left: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  hole: {
    backgroundColor: '#FFFFFF',
    opacity: 0.95,
  },

  tapRow: {
    position: 'absolute',
    left: 0,
    flexDirection: 'row',
  },

  tapZone: {
    flex: 1,
  },

  thumb: {
    position: 'absolute',
    left: 0,
    // backgroundColor: '#3B82F6',
    backgroundColor: COLORS.brandPrimary,
    // thumb에 “살짝 떠있는 느낌” (iOS/Android 둘 다 어느정도 먹게)
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 9,
  },
});
