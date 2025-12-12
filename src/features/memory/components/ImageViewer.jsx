// src/features/memory/components/ImageViewer.jsx
import React, {useEffect, useMemo, useRef} from 'react';
import {Dimensions, Modal, StyleSheet, Image, View} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import Reanimated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function ImageViewer({
  visible,
  images = [],
  index = 0, // ✅ 단일 진실 인덱스
  onClose,
  onIndexChange,
}) {
  const carouselRef = useRef(null);
  const translateY = useSharedValue(0);

  const CLOSE_DISTANCE = 140;
  const CLOSE_VELOCITY = 1200;

  // ✅ 핵심 2) 열릴 때 + index 바뀔 때 viewer 캐러셀을 강제로 동기화
  useEffect(() => {
    if (!visible) return;
    translateY.value = 0;

    requestAnimationFrame(() => {
      carouselRef.current?.scrollTo?.({index, animated: false});
    });
  }, [visible, index, translateY]);

  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .activeOffsetY([-10, 10])
      .failOffsetX([-15, 15])
      .onUpdate(e => {
        translateY.value = e.translationY;
      })
      .onEnd(e => {
        const shouldClose =
          Math.abs(e.translationY) > CLOSE_DISTANCE ||
          Math.abs(e.velocityY) > CLOSE_VELOCITY;

        if (shouldClose) {
          const dir = e.translationY > 0 ? 1 : -1;
          translateY.value = withSpring(dir * SCREEN_HEIGHT, {
            damping: 20,
            stiffness: 220,
          });
          runOnJS(onClose)?.();
        } else {
          translateY.value = withSpring(0, {damping: 18, stiffness: 180});
        }
      });
  }, [onClose, translateY]);

  const tapGesture = useMemo(() => {
    return Gesture.Tap().onEnd(() => runOnJS(onClose)?.());
  }, [onClose]);

  const composed = useMemo(
    () => Gesture.Simultaneous(panGesture, tapGesture),
    [panGesture, tapGesture],
  );

  // 드래그할수록 줌아웃 + 같이 이동
  const contentStyle = useAnimatedStyle(() => {
    const dist = Math.abs(translateY.value);
    const scale = interpolate(
      dist,
      [0, SCREEN_HEIGHT * 0.5],
      [1, 0.86],
      Extrapolate.CLAMP,
    );
    return {transform: [{translateY: translateY.value}, {scale}]};
  });

  // 배경도 같이 빠짐
  const backdropStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      Math.abs(translateY.value),
      [0, SCREEN_HEIGHT * 0.6],
      [1, 0],
      Extrapolate.CLAMP,
    );
    return {opacity};
  });

  const renderItem = ({item}) => (
    <View style={styles.imageWrapper}>
      <Image source={{uri: item}} style={styles.image} />
    </View>
  );

  return (
    <Modal
      visible={!!visible}
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={onClose}>
      <GestureDetector gesture={composed}>
        <Reanimated.View style={styles.root}>
          <Reanimated.View style={[styles.backdrop, backdropStyle]} />

          <Reanimated.View style={[styles.content, contentStyle]}>
            <Carousel
              ref={carouselRef}
              width={SCREEN_WIDTH}
              height={SCREEN_HEIGHT}
              data={images}
              defaultIndex={index} // 최초 진입용
              loop={false}
              onSnapToItem={idx => onIndexChange?.(idx)} // ✅ 스와이프 -> currentImageIndex 변경
              renderItem={renderItem}
              panGestureHandlerProps={{
                activeOffsetX: [-2, 2],
                failOffsetY: [-50, 50],
              }}
            />
          </Reanimated.View>
        </Reanimated.View>
      </GestureDetector>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: 'transparent'},
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  content: {flex: 1},
  imageWrapper: {width: SCREEN_WIDTH, height: SCREEN_HEIGHT},
  image: {width: '100%', height: '100%', resizeMode: 'contain'},
});
