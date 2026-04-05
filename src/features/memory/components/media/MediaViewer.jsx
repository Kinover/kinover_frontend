// src/features/memory/components/MediaViewer.jsx

/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useMemo, useRef, useState, useCallback} from 'react';
import { Modal, StyleSheet, TouchableOpacity, Dimensions, View, FlatList, Platform, PermissionsAndroid, ActivityIndicator } from 'react-native';
import Video from 'react-native-video';
import FastImage from '@d11/react-native-fast-image';

import RNFS from 'react-native-fs';
import AppText from 'components/AppText';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
// eslint-disable-next-line import/no-commonjs
const {CameraRoll} = require('@react-native-camera-roll/camera-roll');

import {
  getResponsiveHeight,
  getResponsiveWidth,
} from 'utils/responsive';

import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {useSharedValue, useAnimatedStyle, withTiming, runOnJS} from 'react-native-reanimated';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
const zoomStyles = StyleSheet.create({
  zoomContainer: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomImageWrap: {
    width: screenWidth,
    height: screenHeight,
  },
  zoomImage: {
    width: '100%',
    height: '100%',
  },
});

/* ================= utils ================= */

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

const ensureAndroidPermission = async () => {
  if (Platform.OS !== 'android') return true;
  if (Platform.Version >= 29) return true;

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
};

const saveUrlToGallery = async ({url, type, album = 'Kinover'}) => {
  const ext = type === 'video' ? 'mp4' : 'jpg';
  const path = `${
    RNFS.CachesDirectoryPath
  }/kinover_${Date.now()}_${Math.random().toString(16).slice(2)}.${ext}`;

  await RNFS.downloadFile({fromUrl: url, toFile: path}).promise;

  await CameraRoll.save(`file://${path}`, {
    type: type === 'video' ? 'video' : 'photo',
    album,
  });
};

/* ================= ZoomableImage ================= */

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

 // “진짜 확대가 시작됐을 때만” 페이징 끄기 위한 플래그
  const disabledPagingOnceRef = useRef(false);

 // FlatList 가로 스와이프를 막지 않게 함
  const [zoomed, setZoomed] = useState(false);

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

    disabledPagingOnceRef.current = false;
    setZoomed(false);
    setPaging(true);
  }, [scale, tx, ty, lastScale, lastTx, lastTy, setPaging]);

  useEffect(() => {
    if (!isActive) reset();
  }, [isActive, reset]);

  const pinch = Gesture.Pinch()
    .runOnJS(true)
    .onUpdate(e => {
      const next = clamp(lastScale.value * e.scale, 1, maxScale);
      scale.value = next;

      if (next > 1.03) {
        if (!zoomed) setZoomed(true);

        if (!disabledPagingOnceRef.current) {
          disabledPagingOnceRef.current = true;
          setPaging(false);
        }
      } else {
 // 아직 확대가 아닌 상태면 스와이프 가능해야 함
        if (!disabledPagingOnceRef.current) {
          setPaging(true);
        }
      }
    })
    .onEnd(() => {
      lastScale.value = scale.value;

      if (scale.value <= 1.01) {
        runOnJS(reset)();
      }
    });

 // zoomed일 때만 pan이 켜짐 -> 기본 상태에서는 FlatList 스와이프가 자연스럽게 동작
  const pan = Gesture.Pan()
    .enabled(zoomed)
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

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .runOnJS(true)
    .onEnd(() => {
      if (scale.value > 1.01) {
        reset();
        return;
      }

      disabledPagingOnceRef.current = true;
      setZoomed(true);
      setPaging(false);

      scale.value = withTiming(doubleTapScale);
      lastScale.value = doubleTapScale;
    });

  const singleTap = Gesture.Tap()
    .numberOfTaps(1)
    .runOnJS(true)
    .onEnd(() => {
 // 필요하면 UI 토글
    });

  const taps = Gesture.Exclusive(doubleTap, singleTap);

 // pan은 zoomed일 때만 켜지므로, 기본 상태에서 가로 스와이프가 FlatList로 잘 넘어감
  const composed = Gesture.Simultaneous(pinch, pan, taps);

  const style = useAnimatedStyle(() => ({
    transform: [
      {translateX: tx.value},
      {translateY: ty.value},
      {scale: scale.value},
    ],
  }));

  return (
    <View style={zoomStyles.zoomContainer}>
      <GestureDetector gesture={composed}>
        <Animated.View style={[zoomStyles.zoomImageWrap, style]}>
          <FastImage
            pointerEvents="none"
            source={{
              uri,
              priority: FastImage.priority.high,
              cache: FastImage.cacheControl.immutable,
            }}
            style={zoomStyles.zoomImage}
            resizeMode={FastImage.resizeMode.contain}
            onError={() =>null
            }
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

/* ================= MediaViewer ================= */

export default function MediaViewer({
  visible,
  media = [], // [{uri,type}]
  index = 0,
  onIndexChange,
  onClose,
}) {
  const styles = useScaledStyleSheet(rf => ({

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  },

  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 46 : 16,
    left: 16,
    right: 16,
    zIndex: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  circleIconBtn: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  circlePillBtn: {
    minWidth: getResponsiveWidth(86),
    height: CIRCLE_SIZE,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getResponsiveWidth(14),
  },

  circlePillText: {
    color: '#fff',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: rf(12.5),
    includeFontPadding: false,
  },

  xText: {
    color: '#fff',
    fontSize: rf(16),
    fontFamily: 'Pretendard-SemiBold',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  indexPill: {
    position: 'relative',
    alignSelf: 'center',
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

  page: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  zoomContainer: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },

  zoomImageWrap: {
    width: screenWidth,
    height: screenHeight,
  },

  zoomImage: {
    width: '100%',
    height: '100%',
  },

  video: {
    width: screenWidth,
    height: screenHeight,
  },

  mediaPlaceholder: {
    width: screenWidth,
    height: screenHeight,
    backgroundColor: 'rgba(30,30,30,0.6)',
  },

  progressOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },

  progressBox: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 26,
    alignItems: 'center',
  },

  progressText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
    fontFamily: 'Pretendard-SemiBold',
  },

  progressSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 8,
    fontFamily: 'Pretendard-Medium',
  },

  }));
  const listRef = useRef(null);

  const cancelRequestedRef = useRef(false);

  const pagingEnabledRef = useRef(true);
  const [pagingEnabled, setPagingEnabled] = useState(true);

  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState({current: 0, total: 0});

  const safeIndex = useMemo(() => {
    if (!media.length) return 0;
    return clamp(index, 0, media.length - 1);
  }, [index, media.length]);

  useEffect(() => {
    if (!visible) return;

    requestAnimationFrame(() => {
      try {
        listRef.current?.scrollToOffset({
          offset: safeIndex * screenWidth,
          animated: false,
        });
      } catch {
        null;
      }
    });
  }, [visible, safeIndex]);

  const togglePaging = useCallback(enabled => {
    if (pagingEnabledRef.current === enabled) return;
    pagingEnabledRef.current = enabled;
    setPagingEnabled(enabled);
  }, []);

  const handleClose = useCallback(() => {
    if (saving) {
      cancelRequestedRef.current = true;
      setSaving(false);
      setTimeout(() => onClose?.(), 300);
      return;
    }
    onClose?.();
  }, [saving, onClose]);

  const _handleSaveAll = useCallback(async () => {
    if (saving || !media.length) return;

    setSaving(true);
    cancelRequestedRef.current = false;
    setProgress({current: 0, total: media.length});

    try {
      const ok = await ensureAndroidPermission();
      if (!ok) throw new Error('permission');

      for (let i = 0; i < media.length; i++) {
        if (cancelRequestedRef.current) throw new Error('cancel');

        const it = media[i];
        const url = it?.uri;
        if (!url) continue;

        setProgress({current: i + 1, total: media.length});

        await saveUrlToGallery({
          url,
          type: String(it?.type) === 'video' ? 'video' : 'photo',
        });
      }
    } catch (e) {
 // 실패/취소는 조용히 종료
    } finally {
      setTimeout(() => {
        setSaving(false);
        setProgress({current: 0, total: 0});
      }, 600);
    }
  }, [media, saving]);

 // OOM 방지: 활성 페이지만 미디어 마운트
  const renderItem = useCallback(
    ({item, index: idx}) => {
      const isVideo = String(item?.type) === 'video';
      const uri = item?.uri ?? '';
      const isActive = safeIndex === idx;

      if (!isActive) {
        return (
          <View style={styles.page}>
            <View style={styles.mediaPlaceholder} />
          </View>
        );
      }

      return (
        <View style={styles.page}>
          {isVideo ? (
            <Video
              source={{uri}}
              style={styles.video}
              resizeMode="contain"
              controls
              paused={false}
              onError={() => {}}
              ignoreSilentSwitch="ignore"
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
    },
    [safeIndex, togglePaging],
  );

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay} />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleClose} style={styles.circleIconBtn}>
          <AppText style={styles.xText}>✕</AppText>
        </TouchableOpacity>

        <View pointerEvents="none" style={styles.indexPill}>
          <AppText style={styles.headerIndex}>
            <AppText style={styles.headerIndexCurrent}>{safeIndex + 1}</AppText>
            {' / '}
            {media.length}
          </AppText>
        </View>

        <View style={{width: CIRCLE_SIZE, height: CIRCLE_SIZE}} />
      </View>

      <FlatList
        ref={listRef}
        data={media}
        horizontal
        pagingEnabled={pagingEnabled}
        scrollEnabled={pagingEnabled}
        showsHorizontalScrollIndicator={false}
        extraData={safeIndex}
        keyExtractor={(it, i) => `${it?.uri}_${i}`}
        getItemLayout={(_, i) => ({
          length: screenWidth,
          offset: screenWidth * i,
          index: i,
        })}
        renderItem={renderItem}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
          const next = clamp(idx, 0, media.length - 1);
          onIndexChange?.(next);
        }}
      />

      {saving && (
        <View style={styles.progressOverlay}>
          <View style={styles.progressBox}>
            <ActivityIndicator size="large" color="#fff" />
            <AppText style={styles.progressText}>
              {progress.current} / {progress.total}
            </AppText>
            <AppText style={styles.progressSub}>
              화면을 나가면 저장이 취소돼요
            </AppText>
          </View>
        </View>
      )}
    </Modal>
  );
}

/* ================= styles ================= */

const CIRCLE_SIZE = getResponsiveWidth(38);

