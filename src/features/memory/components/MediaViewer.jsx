// src/features/memory/components/MediaViewer.jsx
import React, {useEffect, useMemo, useRef, useCallback} from 'react';
import {
  Modal,
  View,
  FlatList,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import Video from 'react-native-video';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import {getResponsiveHeight, getResponsiveWidth} from '../../../utils/responsive';

const {width: W, height: H} = Dimensions.get('window');

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

function ZoomableImage({
  uri,
  isActive,
  onTogglePaging,
  doubleTapScale = 2,
  maxScale = 4,
}) {
  const scale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);

  const lastScale = useSharedValue(1);
  const lastTx = useSharedValue(0);
  const lastTy = useSharedValue(0);

  const setPaging = useCallback(
    enabled => {
      onTogglePaging?.(enabled);
    },
    [onTogglePaging],
  );

  const reset = useCallback(() => {
    scale.value = withTiming(1);
    tx.value = withTiming(0);
    ty.value = withTiming(0);
    lastScale.value = 1;
    lastTx.value = 0;
    lastTy.value = 0;
    setPaging(true);
  }, [scale, tx, ty, lastScale, lastTx, lastTy, setPaging]);

  // ✅ 페이지가 바뀌면(비활성) 자동 리셋
  useEffect(() => {
    if (!isActive) {
      reset();
    }
  }, [isActive, reset]);

  const pinch = Gesture.Pinch()
    .runOnJS(true)
    .onBegin(() => {
      setPaging(false);
    })
    .onUpdate(e => {
      const next = clamp(lastScale.value * e.scale, 1, maxScale);
      scale.value = next;
    })
    .onEnd(() => {
      lastScale.value = scale.value;

      // ✅ 다시 1배면 이동값도 정리 + 페이징 다시 켬
      if (scale.value <= 1.01) {
        runOnJS(reset)();
      }
    });

  const pan = Gesture.Pan()
    .runOnJS(true)
    .onBegin(() => {
      if (scale.value > 1.01) setPaging(false);
    })
    .onUpdate(e => {
      if (scale.value <= 1.01) return;

      // ✅ 너무 멀리 안 나가게 대충 제한(이미지 비율 모르니 “느낌” 제한)
      const limitX = (W * (scale.value - 1)) / 2;
      const limitY = (H * (scale.value - 1)) / 2;

      const nextX = clamp(lastTx.value + e.translationX, -limitX, limitX);
      const nextY = clamp(lastTy.value + e.translationY, -limitY, limitY);

      tx.value = nextX;
      ty.value = nextY;
    })
    .onEnd(() => {
      lastTx.value = tx.value;
      lastTy.value = ty.value;

      if (scale.value <= 1.01) {
        runOnJS(reset)();
      }
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .runOnJS(true)
    .onEnd(() => {
      if (scale.value > 1.01) {
        reset();
        return;
      }
      setPaging(false);
      scale.value = withTiming(doubleTapScale);
      lastScale.value = doubleTapScale;
    });

  const singleTap = Gesture.Tap()
    .numberOfTaps(1)
    .runOnJS(true)
    .onEnd(() => {
      // 필요하면 UI 토글 같은 거 여기서
    });

  // ✅ 더블탭이 싱글탭에 먹히지 않게
  const taps = Gesture.Exclusive(doubleTap, singleTap);

  // ✅ 핀치 + 팬 + 탭을 동시에
  const composed = Gesture.Simultaneous(pinch, pan, taps);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {translateX: tx.value},
        {translateY: ty.value},
        {scale: scale.value},
      ],
    };
  });

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.zoomWrap]}>
        <Animated.View style={[animatedStyle]}>
          <FastImage
            pointerEvents="none"
            source={{
              uri,
              priority: FastImage.priority.high,
              cache: FastImage.cacheControl.immutable,
            }}
            style={styles.image}
            resizeMode={FastImage.resizeMode.contain}
            onError={e =>
              console.log('❌ MediaViewer image error:', uri, e?.nativeEvent)
            }
          />
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

export default function MediaViewer({
  visible,
  media = [], // [{uri,type}]
  index = 0,
  onIndexChange,
  onClose,
}) {
  const listRef = useRef(null);

  // ✅ 확대 중엔 FlatList 페이징을 꺼서 “드래그=이동” 느낌 살리기
  const pagingEnabledRef = useRef(true);
  const [pagingEnabled, setPagingEnabled] = React.useState(true);

  const safeIndex = useMemo(() => {
    if (!media.length) return 0;
    return clamp(index, 0, media.length - 1);
  }, [index, media.length]);

  useEffect(() => {
    if (!visible) return;
    requestAnimationFrame(() => {
      try {
        listRef.current?.scrollToOffset({
          offset: safeIndex * W,
          animated: false,
        });
      } catch {
        null;
      }
    });
  }, [visible, safeIndex]);

  const togglePaging = useCallback(enabled => {
    // 중복 set 방지
    if (pagingEnabledRef.current === enabled) return;
    pagingEnabledRef.current = enabled;
    setPagingEnabled(enabled);
  }, []);

  const renderItem = ({item, index: idx}) => {
    const isVideo = String(item?.type) === 'video';
    const uri = item?.uri;
    const isActive = safeIndex === idx;

    return (
      <View style={styles.page}>
        {isVideo ? (
          <Video
            source={{uri}}
            style={styles.video}
            resizeMode="contain"
            controls
            paused={!isActive}
            onError={e => console.log('❌ MediaViewer video error:', uri, e)}
          />
        ) : (
          <ZoomableImage
            uri={uri}
            isActive={isActive}
            onTogglePaging={togglePaging}
          />
        )}
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay} />

      <TouchableOpacity
        style={styles.closeBtn}
        activeOpacity={0.8}
        onPress={onClose}>
        <FastImage
          pointerEvents="none"
          source={require('../../../assets/images/clearBt1.png')}
          style={styles.closeIcon}
          resizeMode={FastImage.resizeMode.contain}
        />
      </TouchableOpacity>

      <FlatList
        ref={listRef}
        data={media}
        keyExtractor={(it, i) => `${it?.uri}_${i}`}
        horizontal
        pagingEnabled={pagingEnabled}
        scrollEnabled={pagingEnabled} // ✅ 확대 중에는 스와이프 넘김 막고, 이미지 pan으로 이동
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, i) => ({length: W, offset: W * i, index: i})}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / W);
          const next = clamp(idx, 0, media.length - 1);
          onIndexChange?.(next);
        }}
        renderItem={renderItem}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  },
  page: {
    width: W,
    height: H,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ✅ 줌 가능한 이미지 래퍼
  zoomWrap: {
    width: W,
    height: H,
    justifyContent: 'center',
    alignItems: 'center',
  },

  image: {
    width: W,
    height: H,
  },
  video: {
    width: W,
    height: H,
  },
  closeBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? getResponsiveHeight(50) : getResponsiveHeight(20),
    right: getResponsiveWidth(15),
    zIndex: 10,
  },
  closeIcon: {
    width: getResponsiveWidth(22.5),
    height: getResponsiveHeight(22.5),
  },
});
