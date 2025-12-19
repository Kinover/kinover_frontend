// src/features/memory/components/ImageCarousel.jsx
import React, {useEffect, useMemo, useRef, useState, useCallback} from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../../utils/responsive';
import FastImage from '@d11/react-native-fast-image';
import {getVideoThumbnail} from '../../../utils/videoThumbnail';
import MediaViewer from './MediaViewer';

// ✅ RNGH v2
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
// ✅ 핵심: worklet -> JS 호출
import {runOnJS} from 'react-native-reanimated';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

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

export default function ImageCarousel({
  localImages = [],
  localMedia = [],

  currentIndex = 0,
  setCurrentIndex,

  isFullScreen = false,
  setIsFullScreen,

  // ✅ 첫 번째 이미지에서 왼→오 스와이프 시 콜백
  onSwipeFromFirstToRight,
}) {
  const mainCarouselRef = useRef(null);

  const mediaList = useMemo(
    () => normalizeMedia(localImages, localMedia),
    [localImages, localMedia],
  );

  // ✅ currentIndex 동기화
  const lastSyncedRef = useRef(-1);
  useEffect(() => {
    const idx = Number.isInteger(currentIndex) ? currentIndex : 0;
    if (lastSyncedRef.current === idx) return;
    lastSyncedRef.current = idx;

    requestAnimationFrame(() => {
      mainCarouselRef.current?.scrollTo?.({index: idx, animated: false});
    });
  }, [currentIndex]);

  // ✅ 영상 썸네일 캐시
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

  const renderMainItem = ({item, index}) => {
    const uri = item?.uri;
    const isVideo = item?.type === 'video';

    const thumbUri = isVideo ? videoThumbMap[uri] : null;
    if (isVideo && uri && !thumbUri) {
      requestAnimationFrame(() => ensureThumb(uri));
    }

    return (
      <View style={styles.fullItem}>
        <TouchableOpacity
          style={styles.fullTouch}
          activeOpacity={1}
          onPress={() => {
            setCurrentIndex?.(index);
            setIsFullScreen?.(true);
          }}>
          {isVideo ? (
            <>
              {thumbUri ? (
                <FastImage
                  pointerEvents="none"
                  source={{
                    uri: thumbUri,
                    priority: FastImage.priority.normal,
                    cache: FastImage.cacheControl.immutable,
                  }}
                  style={styles.fullMedia}
                  resizeMode={FastImage.resizeMode.contain}
                />
              ) : (
                <View style={[styles.fullMedia, styles.videoFallback]} />
              )}

              <View pointerEvents="none" style={styles.playOverlay}>
                <View style={styles.playCircle}>
                  <View style={styles.playTriangle} />
                </View>
              </View>
            </>
          ) : (
            <FastImage
              pointerEvents="none"
              source={{uri}}
              style={styles.fullMedia}
              resizeMode={FastImage.resizeMode.contain}
            />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // ✅ 핵심: “엣지 스와이프 레이어” + runOnJS로 콜백 호출
  const edgeSwipeGesture = useMemo(() => {
    const THRESHOLD = 70;

    return Gesture.Pan()
      .enabled(!isFullScreen && (currentIndex ?? 0) === 0)
      .activeOffsetX([18, 9999]) // 오른쪽으로 의미있게 움직일 때만
      .failOffsetY([-18, 18]) // 세로 흔들림이면 실패
      .onEnd(e => {
        'worklet';

        const idx = currentIndex ?? 0;
        if (isFullScreen) return;
        if (idx !== 0) return;

        const tx = e.translationX || 0;
        if (tx > THRESHOLD) {
          if (typeof onSwipeFromFirstToRight === 'function') {
            runOnJS(onSwipeFromFirstToRight)();
          }
        }
      });
  }, [currentIndex, isFullScreen, onSwipeFromFirstToRight]);

  if (!mediaList.length) return null;

  return (
    <View style={styles.container}>
      {/* ✅ 상단 중앙 고정 인덱스 */}
      <View pointerEvents="none" style={styles.fixedTopBar}>
        <View style={styles.indexPill}>
          <Text style={styles.headerIndex}>
            <Text style={styles.headerIndexCurrent}>{currentIndex + 1}</Text>
            {' / '}
            {mediaList.length}
          </Text>
        </View>
      </View>

      <View style={styles.carouselWrap}>
        <Carousel
          key={`main-full-${mediaList.length}`}
          ref={mainCarouselRef}
          width={SCREEN_WIDTH}
          data={mediaList}
          defaultIndex={currentIndex}
          onSnapToItem={idx => setCurrentIndex?.(idx)}
          loop={false}
          scrollAnimationDuration={320}
          renderItem={renderMainItem}
        />

        {/* ✅ 왼쪽 “엣지 스와이프” 투명 레이어 */}
        <GestureDetector gesture={edgeSwipeGesture}>
          <View pointerEvents="box-only" style={styles.edgeSwipeZone} />
        </GestureDetector>
      </View>

      <MediaViewer
        visible={!!isFullScreen}
        media={mediaList}
        index={currentIndex}
        onIndexChange={idx => setCurrentIndex?.(idx)}
        onClose={() => setIsFullScreen?.(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f9f9f9'},
  carouselWrap: {flex: 1},

  fullItem: {flex: 1, backgroundColor: '#f9f9f9'},
  fullTouch: {flex: 1},
  fullMedia: {width: '100%', height: '100%'},
  videoFallback: {backgroundColor: '#111827'},

  fixedTopBar: {
    position: 'absolute',
    top:
      Platform.OS === 'ios' ? getResponsiveHeight(15) : getResponsiveHeight(15),
    left: 0,
    right: 0,
    zIndex: 50,
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
    fontSize: getResponsiveFontSize(11),
    fontFamily: 'Pretendard-Medium',
  },
  headerIndexCurrent: {
    color: '#FFC84D',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(13),
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
});
