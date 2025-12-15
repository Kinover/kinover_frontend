// src/features/memory/components/ImageCarousel.jsx
import React, {useEffect, useMemo, useRef, useState, useCallback} from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import {SCREEN_HEIGHT as BS_SCREEN_HEIGHT} from '@gorhom/bottom-sheet';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveIconSize,
} from '../../../utils/responsive';
import FastImage from '@d11/react-native-fast-image';
import {getVideoThumbnail} from '../../../utils/videoThumbnail';
import MediaViewer from './MediaViewer'; // ✅ 아래에 새로 만든 Viewer로 교체

const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_WIDTH =
  Platform.OS === 'android' ? SCREEN_WIDTH * 0.98 : SCREEN_WIDTH * 0.97;

function normalizeMedia(localImages = [], localMedia = []) {
  // localMedia 우선
  if (Array.isArray(localMedia) && localMedia.length) {
    return localMedia
      .filter(Boolean)
      .map(it => {
        // { uri, type } 형태
        if (typeof it === 'object' && it?.uri) {
          const uri = String(it.uri);
          const type = String(it.type || '').toLowerCase();
          const isVideo =
            type === 'video' || /\.mp4(\?|$)/i.test(uri) || /\.mov(\?|$)/i.test(uri);
          return {uri, type: isVideo ? 'video' : 'image'};
        }

        // 문자열도 허용
        const uri = String(it);
        const isVideo = /\.mp4(\?|$)/i.test(uri) || /\.mov(\?|$)/i.test(uri);
        return {uri, type: isVideo ? 'video' : 'image'};
      });
  }

  // 기존 localImages(string[])도 지원
  if (Array.isArray(localImages) && localImages.length) {
    return localImages
      .filter(Boolean)
      .map(uri => {
        const u = String(uri);
        const isVideo = /\.mp4(\?|$)/i.test(u) || /\.mov(\?|$)/i.test(u);
        return {uri: u, type: isVideo ? 'video' : 'image'};
      });
  }

  return [];
}

export default function ImageCarousel({
  // ✅ 둘 다 받을 수 있게
  localImages = [],
  localMedia = [],

  currentIndex = 0,
  setCurrentIndex,
  setCommentIndex,
  commentCount = 0,
  isCommentMode = false,

  isFullScreen = false,
  setIsFullScreen,
}) {
  const mainCarouselRef = useRef(null);

  const mediaList = useMemo(
    () => normalizeMedia(localImages, localMedia),
    [localImages, localMedia],
  );

  // ===== 댓글 모드 애니메이션 (RN Animated) =====
  const progressRef = useRef(new Animated.Value(isCommentMode ? 1 : 0));
  useEffect(() => {
    Animated.timing(progressRef.current, {
      toValue: isCommentMode ? 1 : 0,
      duration: 240,
      useNativeDriver: false,
    }).start();
  }, [isCommentMode]);

  const NORMAL_H = BS_SCREEN_HEIGHT * 0.7;
  const COMPACT_H = BS_SCREEN_HEIGHT * 0.42;

  const animatedHeight = progressRef.current.interpolate({
    inputRange: [0, 1],
    outputRange: [NORMAL_H, COMPACT_H],
  });

  const animatedTranslateY = progressRef.current.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });

  const overlayOpacity = progressRef.current.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0.6],
  });

  const overlayHeightPct = progressRef.current.interpolate({
    inputRange: [0, 1],
    outputRange: ['10%', '15%'],
  });

  const handleCommentToggle = () => setCommentIndex?.(prev => !prev);

  // =========================================================
  // ✅ currentIndex가 바뀌면 캐러셀도 따라가게
  // =========================================================
  const lastSyncedRef = useRef(-1);
  useEffect(() => {
    const idx = Number.isInteger(currentIndex) ? currentIndex : 0;
    if (lastSyncedRef.current === idx) return;
    lastSyncedRef.current = idx;

    requestAnimationFrame(() => {
      mainCarouselRef.current?.scrollTo?.({
        index: idx,
        animated: false,
      });
    });
  }, [currentIndex]);

  // =========================================================
  // ✅ 영상 썸네일 캐시
  // =========================================================
  const [videoThumbMap, setVideoThumbMap] = useState({}); // { [videoUri]: thumbUri }
  const loadingRef = useRef(new Set());

  const ensureThumb = useCallback(async uri => {
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
    } catch (e) {
      // 필요하면 로그
      // console.log('thumb fail:', uri, e?.message || e);
    } finally {
      loadingRef.current.delete(uri);
    }
  }, [videoThumbMap]);

  // 처음 보이는 몇 개만 미리 생성 (성능)
  useEffect(() => {
    const firstFew = mediaList.slice(0, 12);
    (async () => {
      for (const it of firstFew) {
        if (it?.type === 'video') await ensureThumb(it.uri);
      }
    })();
  }, [mediaList, ensureThumb]);

  const renderMainItem = ({item, index}) => {
    const uri = item?.uri;
    const type = item?.type;
    const isVideo = type === 'video';

    const thumbUri = isVideo ? videoThumbMap[uri] : null;
    if (isVideo && uri && !thumbUri) {
      requestAnimationFrame(() => ensureThumb(uri));
    }

    return (
      <View style={[styles.imageWrapper, {width: ITEM_WIDTH}]}>
        <TouchableOpacity
          style={styles.image}
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
                  style={styles.image}
                  resizeMode={FastImage.resizeMode.cover}
                />
              ) : (
                <View style={[styles.image, styles.videoFallback]} />
              )}

              {/* ✅ 영상 표시용 플레이 아이콘(원하면 제거 가능) */}
              <View pointerEvents="none" style={styles.playOverlay}>
                <View style={styles.playTriangle} />
              </View>
            </>
          ) : (
            <FastImage
              pointerEvents="none"
              source={{uri}}
              style={styles.image}
              resizeMode={FastImage.resizeMode.cover}
            />
          )}
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.overlay,
            {
              backgroundColor: 'rgba(0,0,0,1)',
              opacity: overlayOpacity,
              height: overlayHeightPct,
            },
          ]}>
          <View style={styles.commentSection}>
            <TouchableOpacity onPress={handleCommentToggle}>
              <FastImage
                pointerEvents="none"
                source={require('../../../assets/icons/chatCircleDots.png')}
                style={styles.icon}
              />
            </TouchableOpacity>
            <Text style={styles.commentText}>{commentCount}</Text>
          </View>

          <Text style={styles.imageIndexText}>
            <Text style={styles.imageIndexCurrent}>{currentIndex + 1}</Text>
            {' / '}
            {mediaList.length}
          </Text>
        </Animated.View>
      </View>
    );
  };

  if (!mediaList.length) return null;

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          width: SCREEN_WIDTH,
          height: animatedHeight,
          transform: [{translateY: animatedTranslateY}],
          alignItems: 'center',
        }}>
        <Carousel
          key={`main-${mediaList.length}`}
          ref={mainCarouselRef}
          width={SCREEN_WIDTH}
          data={mediaList}
          defaultIndex={currentIndex}
          onSnapToItem={idx => setCurrentIndex?.(idx)}
          loop={false}
          mode="parallax"
          scrollAnimationDuration={400}
          modeConfig={{
            parallaxScrollingScale: 0.8,
            parallaxAdjacentItemScale: 0.7,
          }}
          renderItem={renderMainItem}
        />
      </Animated.View>

      {/* ✅ 풀스크린 Viewer도 image/video 둘 다 */}
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
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignSelf: 'flex-start',
    marginTop:
      Platform.OS === 'ios'
        ? getResponsiveHeight(-40)
        : getResponsiveHeight(-10),
  },
  imageWrapper: {
    flex: 1,
    borderRadius: getResponsiveIconSize(10),
    overflow: 'hidden',
    backgroundColor: 'white',
    alignSelf: 'center',
  },
  image: {
    flex: 1,
  },

  videoFallback: {
    backgroundColor: '#E5E7EB',
  },

  overlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingHorizontal: getResponsiveWidth(15),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  commentSection: {
    flexDirection: 'row',
    gap: getResponsiveWidth(5),
    alignItems: 'center',
  },
  icon: {
    width: getResponsiveIconSize(27),
    height: getResponsiveIconSize(27),
  },
  commentText: {
    color: 'white',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(17),
  },
  imageIndexText: {
    color: 'white',
    fontSize: getResponsiveFontSize(17),
    fontFamily: 'Pretendard-Medium',
  },
  imageIndexCurrent: {
    color: '#FFC84D',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveIconSize(20),
  },

  // ✅ 플레이 오버레이(썸네일 위)
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 22,
    borderTopWidth: 14,
    borderBottomWidth: 14,
    borderLeftColor: 'rgba(255,255,255,0.95)',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 5,
  },
});
