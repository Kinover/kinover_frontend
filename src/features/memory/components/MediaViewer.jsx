// src/features/memory/components/MediaViewer.jsx
import React, {useEffect, useMemo, useRef, useCallback, useState} from 'react';
import {
  Modal,
  View,
  FlatList,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Text,
  PermissionsAndroid,
  ActivityIndicator,
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
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../../utils/responsive';

// ✅ 저장
import RNFS from 'react-native-fs';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';

const {width: W, height: H} = Dimensions.get('window');

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

/* ================= 저장 유틸 ================= */

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
  const path = `${RNFS.CachesDirectoryPath}/kinover_${Date.now()}_${Math.random()
    .toString(16)
    .slice(2)}.${ext}`;

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

  // ✅ “진짜 확대가 시작됐을 때만” 페이징 끄기 위한 플래그
  const disabledPagingOnceRef = useRef(false);

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
    setPaging(true);
  }, [scale, tx, ty, lastScale, lastTx, lastTy, setPaging]);

  useEffect(() => {
    if (!isActive) reset();
  }, [isActive, reset]);

  // ✅ 핵심 수정: pinch 시작에서 페이징을 끄지 않는다.
  //   "실제로 1.03 이상 확대될 때" 한 번만 페이징 off
  const pinch = Gesture.Pinch()
    .runOnJS(true)
    .onUpdate(e => {
      const next = clamp(lastScale.value * e.scale, 1, maxScale);
      scale.value = next;

      if (next > 1.03) {
        if (!disabledPagingOnceRef.current) {
          disabledPagingOnceRef.current = true;
          setPaging(false);
        }
      } else {
        // 확대가 사실상 안 된 상태면 페이징 유지
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

  const pan = Gesture.Pan()
    .runOnJS(true)
    .onBegin(() => {
      if (scale.value > 1.01) setPaging(false);
    })
    .onUpdate(e => {
      if (scale.value <= 1.01) return;

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
      disabledPagingOnceRef.current = true;
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
  const composed = Gesture.Simultaneous(pinch, pan, taps);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {translateX: tx.value},
      {translateY: ty.value},
      {scale: scale.value},
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={styles.zoomWrap}>
        <Animated.View style={animatedStyle}>
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

/* ================= MediaViewer ================= */

export default function MediaViewer({
  visible,
  media = [], // [{uri,type}]
  index = 0,
  onIndexChange,
  onClose,
}) {
  const listRef = useRef(null);

  const pagingEnabledRef = useRef(true);
  const [pagingEnabled, setPagingEnabled] = useState(true);

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
    if (pagingEnabledRef.current === enabled) return;
    pagingEnabledRef.current = enabled;
    setPagingEnabled(enabled);
  }, []);

  /* ===== 전체저장 ===== */

  const cancelRequestedRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState({current: 0, total: 0});

  const handleClose = useCallback(() => {
    if (saving) {
      cancelRequestedRef.current = true;
      setSaving(false);
      setTimeout(() => onClose?.(), 300);
      return;
    }
    onClose?.();
  }, [saving, onClose]);

  const handleSaveAll = useCallback(async () => {
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

      {/* ✅ 인덱스 pill */}
      <View pointerEvents="none" style={styles.fixedTopBar}>
        <View style={styles.indexPill}>
          <Text style={styles.headerIndex}>
            <Text style={styles.headerIndexCurrent}>{safeIndex + 1}</Text>
            {' / '}
            {media.length}
          </Text>
        </View>
      </View>

      {/* ✅ 저장 버튼 */}
      <View style={styles.saveButtonContainer}>
        <TouchableOpacity
          onPress={handleSaveAll}
          disabled={saving}
          activeOpacity={0.9}
          style={[styles.saveBtn, saving && {opacity: 0.5}]}>
          <Text style={styles.saveBtnText}>전체저장</Text>
        </TouchableOpacity>
      </View>

      {/* 닫기 */}
      <TouchableOpacity
        style={styles.closeBtn}
        activeOpacity={0.8}
        onPress={handleClose}>
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
        scrollEnabled={pagingEnabled}
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, i) => ({length: W, offset: W * i, index: i})}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / W);
          const next = clamp(idx, 0, media.length - 1);
          onIndexChange?.(next);
        }}
        renderItem={renderItem}
      />

      {saving && (
        <View style={styles.progressOverlay}>
          <View style={styles.progressBox}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.progressText}>
              {progress.current} / {progress.total}
            </Text>
            <Text style={styles.progressSub}>화면을 나가면 저장이 취소돼요</Text>
          </View>
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
    width: W,
    height: H,
    justifyContent: 'center',
    alignItems: 'center',
  },

  zoomWrap: {
    width: W,
    height: H,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {width: W, height: H},
  video: {width: W, height: H},

  fixedTopBar: {
    position: 'absolute',
    top:
      Platform.OS === 'ios'
        ? getResponsiveHeight(50)
        : getResponsiveHeight(22),
    left: 0,
    right: 0,
    zIndex: 60,
    elevation: 60,
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

  saveButtonContainer: {
    position: 'absolute',
    top:
      Platform.OS === 'ios'
        ? getResponsiveHeight(46)
        : getResponsiveHeight(16),
    left: getResponsiveWidth(16),
    zIndex: 70,
    elevation: 70,
  },
  saveBtn: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: getResponsiveWidth(14),
    paddingVertical: getResponsiveHeight(8),
    borderRadius: getResponsiveWidth(999),
  },
  saveBtnText: {
    color: '#fff',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(12.5),
  },

  closeBtn: {
    position: 'absolute',
    top:
      Platform.OS === 'ios'
        ? getResponsiveHeight(50)
        : getResponsiveHeight(20),
    right: getResponsiveWidth(15),
    zIndex: 80,
    elevation: 80,
  },
  closeIcon: {
    width: getResponsiveWidth(22.5),
    height: getResponsiveHeight(22.5),
  },

  progressOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
    elevation: 2000,
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
  },
});
