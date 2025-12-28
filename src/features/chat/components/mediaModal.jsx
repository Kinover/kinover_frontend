// src/features/post/components/MediaModal.jsx

/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useMemo, useRef, useState, useCallback} from 'react';
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  View,
  FlatList,
  Text,
  Platform,
  Image,
  PermissionsAndroid,
  ActivityIndicator,
} from 'react-native';
import Video from 'react-native-video';
import FastImage from '@d11/react-native-fast-image';

import RNFS from 'react-native-fs';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';

import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../../utils/responsive';

import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

/* ================= utils ================= */

const CLOUDFRONT_DOMAIN = 'https://dzqa9jgkeds0b.cloudfront.net';
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

const toCdnUrl = keyOrUrl => {
  if (!keyOrUrl) return null;
  const raw = String(keyOrUrl).split('?')[0];
  if (raw.startsWith('http')) return raw;
  return `${CLOUDFRONT_DOMAIN.replace(/\/$/, '')}/${raw.replace(/^\/+/, '')}`;
};

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

function ZoomableImage({uri, isActive}) {
  const scale = useSharedValue(1);
  const lastScale = useSharedValue(1);

  const reset = () => {
    scale.value = withTiming(1);
    lastScale.value = 1;
  };

  useEffect(() => {
    if (!isActive) reset();
  }, [isActive]);

  const pinch = Gesture.Pinch()
    .onUpdate(e => {
      scale.value = clamp(lastScale.value * e.scale, 1, 4);
    })
    .onEnd(() => {
      lastScale.value = scale.value;
      if (scale.value <= 1.01) runOnJS(reset)();
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1.01) {
        runOnJS(reset)();
      } else {
        scale.value = withTiming(2);
        lastScale.value = 2;
      }
    });

  const composed = Gesture.Simultaneous(pinch, doubleTap);

  const style = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  return (
    <View style={styles.zoomContainer}>
      <GestureDetector gesture={composed}>
        <Animated.View style={[styles.zoomImageWrap, style]}>
          <FastImage
            source={{uri}}
            style={styles.zoomImage}
            resizeMode={FastImage.resizeMode.contain}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

/* ================= MediaModal ================= */

export default function MediaModal({
  visible,
  mediaUrls = [],
  mediaType = 'image',
  initialIndex = 0,
  onClose,
}) {
  const cancelRequestedRef = useRef(false);

  const resolvedUrls = useMemo(
    () => mediaUrls.map(toCdnUrl).filter(Boolean),
    [mediaUrls],
  );

  const isVideo = mediaType === 'video';

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState({current: 0, total: 0});

  /* ===== 닫기 ===== */
  const handleClose = () => {
    if (saving) {
      cancelRequestedRef.current = true;
      setSaving(false);
      setTimeout(onClose, 300);
      return;
    }
    onClose();
  };

  /* ===== 전체 저장 ===== */
  const handleSaveAll = useCallback(async () => {
    if (saving || !resolvedUrls.length) return;

    setSaving(true);
    cancelRequestedRef.current = false;
    setProgress({current: 0, total: resolvedUrls.length});

    try {
      const ok = await ensureAndroidPermission();
      if (!ok) throw new Error('permission');

      for (let i = 0; i < resolvedUrls.length; i++) {
        if (cancelRequestedRef.current) throw new Error('cancel');

        setProgress({current: i + 1, total: resolvedUrls.length});
        await saveUrlToGallery({
          url: resolvedUrls[i],
          type: isVideo ? 'video' : 'photo',
        });
      }
    } catch (e) {
      // 취소 / 실패는 여기서 그냥 종료
    } finally {
      setTimeout(() => {
        setSaving(false);
        setProgress({current: 0, total: 0});
      }, 600);
    }
  }, [resolvedUrls, isVideo, saving]);

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay} />

      {/* 닫기 */}
      <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
        <Image
          source={require('../../../assets/images/clearBt1.png')}
          style={{width: 22, height: 22}}
        />
      </TouchableOpacity>

      {/* 저장 버튼 */}
      <View style={styles.saveButtonContainer}>
        <TouchableOpacity
          onPress={handleSaveAll}
          disabled={saving}
          style={[styles.saveBtn, saving && {opacity: 0.5}]}>
          <Text style={styles.saveBtnText}>전체저장</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={resolvedUrls}
        horizontal
        pagingEnabled
        keyExtractor={(v, i) => v + i}
        renderItem={({item, index}) =>
          isVideo ? (
            <Video source={{uri: item}} style={styles.video} controls />
          ) : (
            <ZoomableImage uri={item} isActive={index === currentIndex} />
          )
        }
        onMomentumScrollEnd={e =>
          setCurrentIndex(
            Math.round(e.nativeEvent.contentOffset.x / screenWidth),
          )
        }
      />

      {/* ===== 저장 중 인디케이터 ===== */}
      {saving && (
        <View style={styles.progressOverlay}>
          <View style={styles.progressBox}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.progressText}>
              {progress.current} / {progress.total}
            </Text>
            <Text style={styles.progressSub}>
              화면을 나가면 저장이 취소돼요
            </Text>
          </View>
        </View>
      )}
    </Modal>
  );
}

/* ================= styles ================= */

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  },

  closeBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 16,
    zIndex: 50,
  },

  saveButtonContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 46 : 16,
    left: 16,
    zIndex: 50,
  },

  saveBtn: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },

  saveBtnText: {
    color: '#fff',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(12.5),
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
    height: screenHeight * 0.75,
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
  },
});
