/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useMemo, useRef, useState, useCallback} from 'react';
import {
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
  Dimensions,
  View,
  FlatList,
  Text,
  Platform,
  Image,
} from 'react-native';
import Video from 'react-native-video';
import FastImage from '@d11/react-native-fast-image';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
} from '../../../utils/responsive';

import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

const CLOUDFRONT_DOMAIN = 'https://dzqa9jgkeds0b.cloudfront.net';
const trimSlash = s => String(s || '').replace(/\/+$/, '');
const trimLeadingSlash = s => String(s || '').replace(/^\/+/, '');

const toCdnUrl = keyOrUrl => {
  if (!keyOrUrl) return null;
  const raw = String(keyOrUrl).split('?')[0];
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  return `${trimSlash(CLOUDFRONT_DOMAIN)}/${trimLeadingSlash(raw)}`;
};

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

/** =========================
 *  ZoomableImage
 *  ✅ FlatList 가로 스와이프 살리기:
 *  - pan은 "확대 상태"에서만 enabled
 * ========================= */
function ZoomableImage({uri}) {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const startScale = useSharedValue(1);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const [panEnabled, setPanEnabled] = useState(false);
  const setPanEnabledSafe = useCallback(v => {
    setPanEnabled(prev => (prev === v ? prev : v));
  }, []);

  const reset = useCallback(() => {
    scale.value = withTiming(1);
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    setPanEnabledSafe(false);
  }, [scale, translateX, translateY, setPanEnabledSafe]);

  const pinch = useMemo(() => {
    return Gesture.Pinch()
      .onBegin(() => {
        startScale.value = scale.value;
      })
      .onUpdate(e => {
        const next = startScale.value * e.scale;
        const clamped = Math.min(Math.max(next, 1), 4);
        scale.value = clamped;
      })
      .onEnd(() => {
        if (scale.value <= 1.01) {
          reset();
        } else {
          setPanEnabledSafe(true);
        }
      });
  }, [reset, scale, startScale, setPanEnabledSafe]);

  const pan = useMemo(() => {
    return Gesture.Pan()
      .enabled(panEnabled) // ✅ 핵심
      .onBegin(() => {
        startX.value = translateX.value;
        startY.value = translateY.value;
      })
      .onUpdate(e => {
        translateX.value = startX.value + e.translationX;
        translateY.value = startY.value + e.translationY;
      });
  }, [panEnabled, startX, startY, translateX, translateY]);

  const doubleTap = useMemo(() => {
    return Gesture.Tap()
      .numberOfTaps(2)
      .onEnd(() => {
        if (scale.value > 1.01) {
          reset();
        } else {
          scale.value = withTiming(2);
          setPanEnabledSafe(true);
        }
      });
  }, [reset, scale, setPanEnabledSafe]);

  const composed = useMemo(() => {
    return Gesture.Simultaneous(pinch, pan, doubleTap);
  }, [pinch, pan, doubleTap]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {translateX: translateX.value},
        {translateY: translateY.value},
        {scale: scale.value},
      ],
    };
  });

  return (
    <View style={styles.zoomContainer}>
      <GestureDetector gesture={composed}>
        <Animated.View style={[styles.zoomImageWrap, animatedStyle]}>
          <FastImage
            source={{
              uri,
              priority: FastImage.priority.high,
              cache: FastImage.cacheControl.immutable,
            }}
            style={styles.zoomImage}
            resizeMode={FastImage.resizeMode.contain}
            onError={e =>
              console.log('❌ MediaModal image error:', uri, e?.nativeEvent)
            }
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

export default function MediaModal({
  visible,
  mediaUrls = [],
  mediaType = 'image', // 'image' | 'video'
  initialIndex = 0,
  onClose,
}) {
  const listRef = useRef(null);
  const rafRef = useRef(null);

  const safeKeys = useMemo(() => {
    if (!Array.isArray(mediaUrls)) return [];
    return mediaUrls.filter(Boolean);
  }, [mediaUrls]);

  const resolvedUrls = useMemo(() => {
    return safeKeys.map(toCdnUrl).filter(Boolean);
  }, [safeKeys]);

  const hasData = resolvedUrls.length > 0;
  const isVideo = String(mediaType || 'image').toLowerCase() === 'video';

  const safeInitialIndex = useMemo(() => {
    if (!resolvedUrls.length) return 0;
    return clamp(initialIndex, 0, resolvedUrls.length - 1);
  }, [resolvedUrls.length, initialIndex]);

  const [currentIndex, setCurrentIndex] = useState(safeInitialIndex);

  useEffect(() => {
    if (!visible) return;
    setCurrentIndex(safeInitialIndex);
  }, [visible, safeInitialIndex]);

  useEffect(() => {
    if (!visible) return;
    if (!hasData) return;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
      if (!listRef.current) return;
      try {
        listRef.current.scrollToOffset({
          offset: safeInitialIndex * screenWidth,
          animated: false,
        });
      } catch {
        null;
      }
    });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [visible, hasData, safeInitialIndex]);

  useEffect(() => {
    if (!visible) return;
    if (!hasData) return;
    if (isVideo) return;

    const cur = clamp(safeInitialIndex, 0, resolvedUrls.length - 1);
    const candidates = [cur, cur - 1, cur + 1]
      .filter(i => i >= 0 && i < resolvedUrls.length)
      .map(i => resolvedUrls[i]);

    FastImage.preload(
      candidates.map(uri => ({
        uri,
        priority: FastImage.priority.high,
      })),
    );
  }, [visible, hasData, isVideo, resolvedUrls, safeInitialIndex]);

  const renderItem = useCallback(
    ({item, index}) => {
      return (
        <View style={styles.page}>
          {isVideo ? (
            <View style={styles.videoWrap}>
              <Video
                source={{uri: item}}
                style={styles.video}
                resizeMode="contain"
                controls
                paused={currentIndex !== index}
                repeat={false}
                playInBackground={false}
                playWhenInactive={false}
                disableFocus={true}
                ignoreSilentSwitch="ignore"
                onError={e =>
                  console.log('❌ MediaModal video error:', item, e)
                }
              />
            </View>
          ) : (
            <ZoomableImage uri={item} />
          )}
        </View>
      );
    },
    [isVideo, currentIndex],
  );

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay} />

      {hasData && resolvedUrls.length > 1 && (
        <View style={styles.indicatorContainer}>
          <Text style={styles.indicatorText}>
            {currentIndex + 1} / {resolvedUrls.length}
          </Text>
        </View>
      )}

      <View style={styles.closeButtonContainer}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Image
            source={require('../../../assets/images/clearBt1.png')}
            style={{
              width: getResponsiveWidth(22.5),
              height: getResponsiveHeight(22.5),
            }}
            resizeMode={FastImage.resizeMode.contain}
          />
        </TouchableWithoutFeedback>
      </View>

      {hasData ? (
        <FlatList
          ref={listRef}
          data={resolvedUrls}
          keyExtractor={(item, index) => String(item) + index}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          getItemLayout={(_, index) => ({
            length: screenWidth,
            offset: screenWidth * index,
            index,
          })}
          removeClippedSubviews={false}
          initialNumToRender={3}
          windowSize={5}
          maxToRenderPerBatch={3}
          onMomentumScrollEnd={e => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
            const safeIdx = clamp(idx, 0, resolvedUrls.length - 1);
            setCurrentIndex(safeIdx);

            if (!isVideo && resolvedUrls.length) {
              const candidates = [safeIdx, safeIdx - 1, safeIdx + 1]
                .filter(i => i >= 0 && i < resolvedUrls.length)
                .map(i => resolvedUrls[i]);

              FastImage.preload(
                candidates.map(uri => ({
                  uri,
                  priority: FastImage.priority.high,
                })),
              );
            }
          }}
          renderItem={renderItem}
        />
      ) : (
        <View style={styles.emptyPage}>
          <Text style={styles.emptyText}>표시할 미디어가 없어요</Text>
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  },

  page: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyPage: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(14),
    opacity: 0.8,
  },

  zoomContainer: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  zoomImageWrap: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomImage: {
    width: screenWidth,
    height: screenHeight,
  },

  videoWrap: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: screenWidth,
    height: screenHeight * 0.75,
  },

  closeButtonContainer: {
    position: 'absolute',
    top:
      Platform.OS === 'ios' ? getResponsiveHeight(50) : getResponsiveHeight(20),
    right: getResponsiveWidth(15),
    zIndex: 10,
  },
  indicatorContainer: {
    position: 'absolute',
    top:
      Platform.OS === 'ios' ? getResponsiveHeight(50) : getResponsiveHeight(20),
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    zIndex: 10,
  },
  indicatorText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(14),
    fontWeight: '600',
  },
});
