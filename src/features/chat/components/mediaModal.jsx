
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
  runOnJS,
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
 *  ✅ 핀치 줌 / 드래그 이동 / 더블탭 확대↔원복
 *  ✅ 확대 중에는 FlatList 스와이프(넘김) 막기 위해 onTogglePaging 사용
 * ========================= */
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
    if (!isActive) reset();
  }, [isActive, reset]);

  const pinch = useMemo(() => {
    return Gesture.Pinch()
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

        if (scale.value <= 1.01) {
          runOnJS(reset)();
        }
      });
  }, [maxScale, reset, scale, lastScale, setPaging]);

  const pan = useMemo(() => {
    return Gesture.Pan()
      .runOnJS(true)
      .onBegin(() => {
        if (scale.value > 1.01) setPaging(false);
      })
      .onUpdate(e => {
        if (scale.value <= 1.01) return;

        const limitX = (screenWidth * (scale.value - 1)) / 2;
        const limitY = (screenHeight * (scale.value - 1)) / 2;

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
  }, [reset, scale, setPaging, tx, ty, lastTx, lastTy]);

  const doubleTap = useMemo(() => {
    return Gesture.Tap()
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
  }, [doubleTapScale, reset, scale, setPaging, lastScale]);

  const composed = useMemo(() => {
    // 동시에 동작 (핀치/팬/더블탭)
    return Gesture.Simultaneous(pinch, pan, doubleTap);
  }, [pinch, pan, doubleTap]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{translateX: tx.value}, {translateY: ty.value}, {scale: scale.value}],
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

  // ✅ 확대 중이면 FlatList 넘김 막기
  const pagingEnabledRef = useRef(true);
  const [pagingEnabled, setPagingEnabled] = useState(true);

  const togglePaging = useCallback(enabled => {
    if (pagingEnabledRef.current === enabled) return;
    pagingEnabledRef.current = enabled;
    setPagingEnabled(enabled);
  }, []);

  useEffect(() => {
    if (!visible) return;
    setCurrentIndex(safeInitialIndex);
    // 모달 다시 열면 스와이프는 기본 허용
    setPagingEnabled(true);
    pagingEnabledRef.current = true;
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
      const isActive = currentIndex === index;

      return (
        <View style={styles.page}>
          {isVideo ? (
            <View style={styles.videoWrap}>
              <Video
                source={{uri: item}}
                style={styles.video}
                resizeMode="contain"
                controls
                paused={!isActive}
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
            <ZoomableImage
              uri={item}
              isActive={isActive}
              onTogglePaging={togglePaging}
            />
          )}
        </View>
      );
    },
    [isVideo, currentIndex, togglePaging],
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
          pagingEnabled={pagingEnabled}
          scrollEnabled={pagingEnabled}
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

            // ✅ 페이지 바뀌면 스와이프 기본 복귀 (각 페이지 ZoomableImage가 비활성되며 reset됨)
            togglePaging(true);

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