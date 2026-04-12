// src/features/memory/components/ImageCarousel.jsx
import React, {useEffect, useMemo, useRef, useState, useCallback} from 'react';
import { Dimensions, Platform, StyleSheet, View, Pressable, FlatList } from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import AppText from 'components/AppText';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {
  getResponsiveHeight,
  getResponsiveWidth,
} from 'utils/responsive';

import FastImage from '@d11/react-native-fast-image';
import Video from 'react-native-video';
import {getVideoThumbnail} from 'utils/videoThumbnail';

// RNGH v2 + Reanimated
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

function normalizeMedia(localImages = [], localMedia = []) {
  if (Array.isArray(localMedia) && localMedia.length) {
    return localMedia.filter(Boolean).map(it => {
      if (typeof it === 'object' && it?.uri) {
        const uri = String(it.uri);
        const type = String(it.type || '').toLowerCase();
        const isVideo =
          type === 'video' ||
          /\.mp4(\?|$)/i.test(uri) ||
          /\.mov(\?|$)/i.test(uri);
        return {uri, type: isVideo ? 'video' : 'image'};
      }
      const uri = String(it);
      const isVideo = /\.mp4(\?|$)/i.test(uri) || /\.mov(\?|$)/i.test(uri);
      return {uri, type: isVideo ? 'video' : 'image'};
    });
  }

  if (Array.isArray(localImages) && localImages.length) {
    return localImages.filter(Boolean).map(uri => {
      const u = String(uri);
      const isVideo = /\.mp4(\?|$)/i.test(u) || /\.mov(\?|$)/i.test(u);
      return {uri: u, type: isVideo ? 'video' : 'image'};
    });
  }

  return [];
}

/**
 * 요구사항 반영
 * 1) MediaViewer 진입 제거 (더블탭/풀스크린 없음) -> (※ 아래는 더블탭 줌만 유지)
 * 2) 이 캐러셀 안에서 이미지/영상 줌인/줌아웃 (pinch)
 * 3) 이 캐러셀 안에서 영상 재생 (thumbnail + play overlay -> 재생)
 * 4) 줌 상태에서 스와이프 충돌 최소화:
 * - scale > 1이면 캐러셀 스크롤 비활성
 * - scale === 1이면 pan 제스처 자체가 캐러셀 스와이프를 가로채지 않게 구성(핵심 수정)
 */

export default function ImageCarousel({
  localImages = [],
  localMedia = [],

  currentIndex = 0,
  setCurrentIndex,

  _isFullScreen = false, // eslint-disable-line no-unused-vars
  _setIsFullScreen, // eslint-disable-line no-unused-vars

  onSwipeFromFirstToRight,
  onSingleTap,
  isChromeHidden = false,
}) {
  const styles = useScaledStyleSheet(rf => ({

  container: {flex: 1, backgroundColor: '#f9f9f9'},
  carouselWrap: {flex: 1},

  fullItem: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: '100%',
    backgroundColor: '#f9f9f9',
    overflow: 'hidden',
  },
  fullTouch: {flex: 1},

  fullMedia: {width: '100%', height: '100%'},
  fullMediaInner: {width: '100%', height: '100%'},
  video: {width: '100%', height: '100%'},
  videoFallback: {backgroundColor: '#111827'},

  fixedTopBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? '13%' : '8%',
    left: 0,
    right: 0,
    zIndex: 999,
    elevation: 50,
    alignItems: 'center',
  },
  indexPill: {
    backgroundColor: 'rgba(0,0,0,0.28)',
    paddingHorizontal: getResponsiveWidth(10),
    paddingVertical: getResponsiveHeight(3),
    borderRadius: getResponsiveWidth(999),
  },
  headerIndex: {
    color: '#FFF',
    fontSize: rf(11),
    fontFamily: 'Pretendard-Medium',
  },
  headerIndexCurrent: {
    color: '#FFC84D',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: rf(13),
  },

  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playCircle: {
    width: getResponsiveWidth(56),
    height: getResponsiveWidth(56),
    borderRadius: getResponsiveWidth(28),
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 18,
    borderTopWidth: 12,
    borderBottomWidth: 12,
    borderLeftColor: 'rgba(255,255,255,0.95)',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 4,
  },

  edgeSwipeZone: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: getResponsiveWidth(32),
    zIndex: 999,
    elevation: 999,
    backgroundColor: 'transparent',
  },

  }));
  const listRef = useRef(null);
  const insets = useSafeAreaInsets();
 // 안드로이드에서 인디케이터가 헤더에 가리지 않도록: safe top + 네비 헤더 높이
  const indicatorTop =
    Platform.OS === 'android'
      ? (insets?.top ?? 0) + getResponsiveHeight(48)
      : undefined;

  const mediaList = useMemo(
    () => normalizeMedia(localImages, localMedia),
    [localImages, localMedia],
  );

 // currentIndex 동기화
  const lastSyncedRef = useRef(-1);
  useEffect(() => {
    const idx = Number.isInteger(currentIndex) ? currentIndex : 0;
    if (lastSyncedRef.current === idx) return;
    lastSyncedRef.current = idx;

    requestAnimationFrame(() => {
      try {
        listRef.current?.scrollToOffset?.({
          offset: SCREEN_WIDTH * idx,
          animated: false,
        });
      } catch (e) {
        null;
      }
    });
  }, [currentIndex]);

 // 영상 썸네일 캐시
  const [videoThumbMap, setVideoThumbMap] = useState({});
  const loadingRef = useRef(new Set());

  const ensureThumb = useCallback(
    async uri => {
      try {
        if (!uri) return;
        if (videoThumbMap[uri]) return;
        if (loadingRef.current.has(uri)) return;
        loadingRef.current.add(uri);

        const t = await getVideoThumbnail(uri);
        const thumbUri = t?.uri || null;

        if (thumbUri) {
          setVideoThumbMap(prev => ({...prev, [uri]: thumbUri}));
        }
      } finally {
        loadingRef.current.delete(uri);
      }
    },
    [videoThumbMap],
  );

  useEffect(() => {
    const firstFew = mediaList.slice(0, 10);
    (async () => {
      for (const it of firstFew) {
        if (it?.type === 'video') await ensureThumb(it.uri);
      }
    })();
  }, [mediaList, ensureThumb]);

 // =========================
 // 재생 상태: 인덱스별 관리
 // =========================
  const [playingIndex, setPlayingIndex] = useState(-1);

 // 인덱스 바뀌면 재생 끄기
  useEffect(() => {
    setPlayingIndex(-1);
  }, [currentIndex]);

 // =========================
 // 줌 상태
 // =========================
  const scale = useSharedValue(1);
  const baseScale = useSharedValue(1);

  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const lastTx = useSharedValue(0);
  const lastTy = useSharedValue(0);

  const [isCarouselEnabled, setIsCarouselEnabled] = useState(true);

  const clamp = (v, min, max) => {
    'worklet';
    return Math.max(min, Math.min(max, v));
  };

  const resetZoom = useCallback(() => {
    scale.value = withTiming(1, {duration: 160});
    baseScale.value = 1;

    tx.value = withTiming(0, {duration: 160});
    ty.value = withTiming(0, {duration: 160});
    lastTx.value = 0;
    lastTy.value = 0;

    runOnJS(setIsCarouselEnabled)(true);
  }, [scale, baseScale, tx, ty, lastTx, lastTy]);

 // 인덱스 바뀌면 줌 리셋
  useEffect(() => {
    resetZoom();
  }, [currentIndex, resetZoom]);

  useEffect(() => {
    if (!isChromeHidden) {
      resetZoom();
    }
  }, [isChromeHidden, resetZoom]);

  const animatedMediaStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {translateX: tx.value},
        {translateY: ty.value},
        {scale: scale.value},
      ],
    };
  }, []);

 // pinch (줌)
  const pinchGesture = useMemo(() => {
    return Gesture.Pinch()
      .onBegin(() => {
        'worklet';
        baseScale.value = scale.value;
      })
      .onUpdate(e => {
        'worklet';
        const next = clamp(baseScale.value * e.scale, 1, 3);
        scale.value = next;
      })
      .onEnd(() => {
        'worklet';
        if (scale.value <= 1.08) {
          scale.value = withTiming(1, {duration: 160});
          baseScale.value = 1;

          tx.value = withTiming(0, {duration: 160});
          ty.value = withTiming(0, {duration: 160});
          lastTx.value = 0;
          lastTy.value = 0;

          runOnJS(setIsCarouselEnabled)(true);
        } else {
          baseScale.value = scale.value;
          runOnJS(setIsCarouselEnabled)(false);
        }
      });
  }, [baseScale, scale, tx, ty, lastTx, lastTy]);

 // - scale <= 1일 때는 pan 제스처를 'fail' 시켜서 캐러셀이 스와이프를 가져가게 함
  const panGesture = useMemo(() => {
    const PAN_SLOP = 2;

    return Gesture.Pan()
      .minDistance(PAN_SLOP)
      .maxPointers(1)
      .onUpdate(e => {
        'worklet';
        const maxX = (SCREEN_WIDTH * (scale.value - 1)) / 2;
        const maxY = (SCREEN_HEIGHT * (scale.value - 1)) / 2;

        tx.value = clamp(lastTx.value + e.translationX, -maxX, maxX);
        ty.value = clamp(lastTy.value + e.translationY, -maxY, maxY);
      })
      .onEnd(() => {
        'worklet';
        if (scale.value <= 1.01) return;
        lastTx.value = tx.value;
        lastTy.value = ty.value;
      });
  }, [scale, tx, ty, lastTx, lastTy]);

 // 위 방식에서 Gesture.fail()이 환경에 따라 불안하면(타입/번들)
 // 아래 "조건부 제스처 합성" 방식이 제일 안정적이라 render 쪽에서 사용함.

 // tap: 단일 탭은 chrome 토글 / 더블탭은 줌 토글(1 <-> 2)
  const singleTapHandler = useCallback(() => {
    if (typeof onSingleTap === 'function') onSingleTap();
  }, [onSingleTap]);

  const tapGesture = useMemo(() => {
    const doubleTap = Gesture.Tap()
      .numberOfTaps(2)
      .maxDelay(250)
      .onEnd((_e, success) => {
        'worklet';
        if (!success) return;
        if (!isChromeHidden) return;

        if (scale.value <= 1.01) {
          scale.value = withTiming(2, {duration: 160});
          baseScale.value = 2;
          runOnJS(setIsCarouselEnabled)(false);
        } else {
          runOnJS(resetZoom)();
        }
      });

    const singleTap = Gesture.Tap()
      .numberOfTaps(1)
      .onEnd((_e, success) => {
        'worklet';
        if (!success) return;
        runOnJS(singleTapHandler)();
      });

    return Gesture.Exclusive(doubleTap, singleTap);
  }, [scale, baseScale, resetZoom, singleTapHandler, isChromeHidden]);

  const composedGesture = useMemo(() => {
    if (!isChromeHidden) {
 // 헤더/바텀시트가 보일 땐 탭으로 UI 토글만 허용
      return Gesture.Simultaneous(tapGesture);
    }

    if (isCarouselEnabled) {
 // 평상시: pinch + tap (핀치 시작 허용, 단일 손가락 스와이프는 캐러셀이 처리)
      return Gesture.Simultaneous(pinchGesture, tapGesture);
    }
 // 줌 상태: pinch + pan + tap
    return Gesture.Simultaneous(pinchGesture, panGesture, tapGesture);
  }, [isChromeHidden, isCarouselEnabled, pinchGesture, panGesture, tapGesture]);

 // ��엣지 스와이프” (첫 장에서 오른쪽으로 크게 드래그하면 뒤로가기)
  const edgeSwipeGesture = useMemo(() => {
    const THRESHOLD = 70;

    return Gesture.Pan()
      .enabled((currentIndex ?? 0) === 0 && isCarouselEnabled)
      .activeOffsetX([18, 9999])
      .failOffsetY([-18, 18])
      .onEnd(e => {
        'worklet';
        const idx = currentIndex ?? 0;
        if (idx !== 0) return;

        const move = e.translationX || 0;
        if (move > THRESHOLD) {
          if (typeof onSwipeFromFirstToRight === 'function') {
            runOnJS(onSwipeFromFirstToRight)();
          }
        }
      });
  }, [currentIndex, onSwipeFromFirstToRight, isCarouselEnabled]);

 // =========================
 // 아이템 렌더
 // =========================
  const renderMainItem = ({item, index}) => {
    const uri = item?.uri;
    const isV = item?.type === 'video';

    const thumbUri = isV ? videoThumbMap[uri] : null;
    if (isV && uri && !thumbUri) {
      requestAnimationFrame(() => ensureThumb(uri));
    }

    const isPlaying = playingIndex === index;
 // OOM 방지: 현재 슬라이드이면서 재생 중일 때만 Video 마운트
    const mountVideo = isV && index === currentIndex && isPlaying;

    return (
      <View style={styles.fullItem}>
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={styles.fullTouch}>
            {isV ? (
              <>
                {mountVideo ? (
                  <Animated.View style={[styles.fullMedia, animatedMediaStyle]}>
                    <Video
                      source={{uri}}
                      style={styles.video}
                      resizeMode="contain"
                      controls
                      paused={false}
                      onEnd={() => setPlayingIndex(-1)}
                      onError={() => {
                        setPlayingIndex(-1);
                      }}
                      ignoreSilentSwitch="ignore"
                    />
                  </Animated.View>
                ) : (
                  <>
                    <Animated.View style={[styles.fullMedia, animatedMediaStyle]}>
                      {thumbUri ? (
                        <FastImage
                        fallback={true}

                          pointerEvents="none"
                          source={{
                            uri: thumbUri,
                            priority: FastImage.priority.normal,
                            cache: FastImage.cacheControl.immutable,
                          }}
                          style={styles.fullMediaInner}
                          resizeMode={FastImage.resizeMode.contain}
                        />
                      ) : (
                        <View style={[styles.fullMediaInner, styles.videoFallback]} />
                      )}
                    </Animated.View>

                    <Pressable
                      onPress={() => {
                        resetZoom();
                        setPlayingIndex(index);
                      }}
                      style={styles.playOverlay}>
                      <View style={styles.playCircle}>
                        <View style={styles.playTriangle} />
                      </View>
                    </Pressable>
                  </>
                )}
              </>
            ) : (
              <Animated.View style={[styles.fullMedia, animatedMediaStyle]}>
                <FastImage
                        fallback={true}

                  pointerEvents="none"
                  source={{uri}}
                  style={styles.fullMediaInner}
                  resizeMode={FastImage.resizeMode.contain}
                />
              </Animated.View>
            )}
          </Animated.View>
        </GestureDetector>
      </View>
    );
  };

  if (!mediaList.length) return null;

  return (
    <View style={styles.container}>
      {/* 상단 중앙 고정 인덱스 (안드로이드: 헤더 아래로 배치) */}
      {!isChromeHidden && (
        <View
          pointerEvents="none"
          style={[
            styles.fixedTopBar,
            indicatorTop != null && {top: indicatorTop},
          ]}>
          <View style={styles.indexPill}>
            <AppText allowFontScaling={false} style={styles.headerIndex}>
              <AppText allowFontScaling={false} style={styles.headerIndexCurrent}>{currentIndex + 1}</AppText>
              {' / '}
              {mediaList.length}
            </AppText>
          </View>
        </View>
      )}

      <View style={styles.carouselWrap}>
        <FlatList
          ref={listRef}
          data={mediaList}
          horizontal
          pagingEnabled={isCarouselEnabled}
          scrollEnabled={isCarouselEnabled}
          bounces={false}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, idx) => `${item?.uri || 'media'}-${idx}`}
          renderItem={renderMainItem}
          extraData={currentIndex}
          initialNumToRender={1}
          windowSize={3}
          maxToRenderPerBatch={2}
          removeClippedSubviews={true}
          getItemLayout={(_, idx) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * idx,
            index: idx,
          })}
          onMomentumScrollEnd={e => {
            const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            if (next === currentIndex) return;
            setCurrentIndex?.(next);
            setPlayingIndex(-1);
            resetZoom();
          }}
        />

        {/* 왼쪽 “엣지 스와이프” 투명 레이어 */}
        <GestureDetector gesture={edgeSwipeGesture}>
          <View pointerEvents="box-only" style={styles.edgeSwipeZone} />
        </GestureDetector>
      </View>
    </View>
  );
}

