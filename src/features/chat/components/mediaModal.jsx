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
  PermissionsAndroid,
  ActivityIndicator,
} from 'react-native';
import Video from 'react-native-video';
import FastImage from '@d11/react-native-fast-image';

import RNFS from 'react-native-fs';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';

import {getResponsiveFontSize, getResponsiveWidth} from '../../../utils/responsive';
import ToastModal from '../../../components/ToastModal';

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

function ZoomableImage({uri, isActive}) {
  const scale = useSharedValue(1);
  const lastScale = useSharedValue(1);

  const reset = useCallback(() => {
    scale.value = withTiming(1);
    lastScale.value = 1;
  }, [scale, lastScale]);

  useEffect(() => {
    if (!isActive) reset();
  }, [isActive, reset]);

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
  // ✅ hooks는 무조건 최상단에서 동일하게 실행
  const cancelRequestedRef = useRef(false);

  const resolvedUrls = useMemo(
    () => mediaUrls.map(toCdnUrl).filter(Boolean),
    [mediaUrls],
  );

  const isVideo = mediaType === 'video';

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState({current: 0, total: 0});

  const [menuVisible, setMenuVisible] = useState(false);
  const menuAnim = useSharedValue(0);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = useCallback(msg => {
    setToastMessage(msg);
    setToastVisible(true);
  }, []);

  const openMenu = useCallback(() => {
    if (saving || !resolvedUrls.length) return;
    setMenuVisible(true);
    menuAnim.value = withTiming(1, {duration: 140});
  }, [saving, resolvedUrls.length, menuAnim]);

  const closeMenu = useCallback(() => {
    menuAnim.value = withTiming(0, {duration: 120}, finished => {
      if (finished) runOnJS(setMenuVisible)(false);
    });
  }, [menuAnim]);

  const menuOverlayStyle = useAnimatedStyle(() => ({
    opacity: menuAnim.value,
  }));
  const menuBoxStyle = useAnimatedStyle(() => ({
    opacity: menuAnim.value,
    transform: [{translateY: (1 - menuAnim.value) * -6}],
  }));

  const handleClose = useCallback(() => {
    // 닫을 때 메뉴도 같이 정리
    if (menuVisible) closeMenu();

    if (saving) {
      cancelRequestedRef.current = true;
      setSaving(false);
      setTimeout(onClose, 300);
      return;
    }
    onClose();
  }, [saving, onClose, menuVisible, closeMenu]);

  const runSave = useCallback(
    async mode => {
      if (saving || !resolvedUrls.length) return;

      setSaving(true);
      cancelRequestedRef.current = false;

      const total = mode === 'all' ? resolvedUrls.length : 1;
      setProgress({current: 0, total});

      try {
        const ok = await ensureAndroidPermission();
        if (!ok) throw new Error('permission');

        if (mode === 'single') {
          const target = resolvedUrls[currentIndex];
          if (!target) throw new Error('no_target');

          setProgress({current: 1, total: 1});
          await saveUrlToGallery({
            url: target,
            type: isVideo ? 'video' : 'photo',
          });

          showToast(isVideo ? '영상이 저장됐어요' : '사진이 저장됐어요');
        } else {
          for (let i = 0; i < resolvedUrls.length; i++) {
            if (cancelRequestedRef.current) throw new Error('cancel');

            setProgress({current: i + 1, total: resolvedUrls.length});
            await saveUrlToGallery({
              url: resolvedUrls[i],
              type: isVideo ? 'video' : 'photo',
            });
          }

          showToast(isVideo ? '영상이 모두 저장됐어요' : '사진이 모두 저장됐어요');
        }
      } catch (e) {
        // 실패/취소는 토스트 생략
      } finally {
        setTimeout(() => {
          setSaving(false);
          setProgress({current: 0, total: 0});
        }, 600);
      }
    },
    [saving, resolvedUrls, currentIndex, isVideo, showToast],
  );

  // visible false 될 때 정리
  useEffect(() => {
    if (!visible) {
      setMenuVisible(false);
      menuAnim.value = 0;
    }
  }, [visible, menuAnim]);

  // initialIndex가 바뀌어서 다시 열리는 케이스 대비
  useEffect(() => {
    setCurrentIndex(initialIndex || 0);
  }, [initialIndex]);

  const isMenuDisabled = saving || !resolvedUrls.length;

  const renderItem = useCallback(
    ({item, index}) =>
      isVideo ? (
        <Video source={{uri: item}} style={styles.video} controls />
      ) : (
        <ZoomableImage uri={item} isActive={index === currentIndex} />
      ),
    [isVideo, currentIndex],
  );

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay} />

      {/* 상단 버튼 */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleClose} style={styles.circleIconBtn}>
          <Text style={styles.xText}>✕</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={openMenu}
          disabled={isMenuDisabled}
          style={[styles.circleIconBtn, isMenuDisabled && {opacity: 0.5}]}>
          <FastImage
            source={require('../../../assets/images/dots_white.png')}
            style={styles.dotsIcon}
            resizeMode={FastImage.resizeMode.contain}
          />
        </TouchableOpacity>
      </View>

      {/* 미디어 */}
      <FlatList
        data={resolvedUrls}
        horizontal
        pagingEnabled
        extraData={currentIndex} // ✅ 안정화
        keyExtractor={(v, i) => `${v}_${i}`}
        renderItem={renderItem}
        onMomentumScrollEnd={e => {
          const next = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
          setCurrentIndex(next);
        }}
      />

      {/* 메뉴 */}
      <Animated.View
        pointerEvents={menuVisible ? 'auto' : 'none'}
        style={[styles.menuOverlay, menuOverlayStyle]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={closeMenu}
        />

        <Animated.View style={[styles.menuBox, menuBoxStyle]}>
          <TouchableOpacity
            onPress={() => {
              closeMenu();
              runSave('single');
            }}
            disabled={saving || !resolvedUrls[currentIndex]}
            activeOpacity={0.85}
            style={[
              styles.menuItem,
              (saving || !resolvedUrls[currentIndex]) && {opacity: 0.5},
            ]}>
            <Text style={styles.menuText}>사진 개별저장</Text>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            onPress={() => {
              closeMenu();
              runSave('all');
            }}
            disabled={saving || !resolvedUrls.length}
            activeOpacity={0.85}
            style={[
              styles.menuItem,
              (saving || !resolvedUrls.length) && {opacity: 0.5},
            ]}>
            <Text style={styles.menuText}>전체저장</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* 저장 중 */}
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

      {/* 토스트 */}
      <ToastModal
        visible={toastVisible}
        message={toastMessage}
        onClose={() => setToastVisible(false)}
        useNativeModal={false}
      />
    </Modal>
  );
}

/* ================= styles ================= */

const CIRCLE_SIZE = getResponsiveWidth(38);

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  },

  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 46 : 16,
    left: 16,
    right: 16,
    zIndex: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  circleIconBtn: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  xText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'Pretendard-SemiBold',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  dotsIcon: {
    width: getResponsiveWidth(16),
    height: getResponsiveWidth(16),
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

  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 80,
    backgroundColor: 'rgba(0,0,0,0.12)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop:
      Platform.OS === 'ios' ? 46 + CIRCLE_SIZE + 10 : 16 + CIRCLE_SIZE + 10,
    paddingRight: 16,
  },

  menuBox: {
    width: getResponsiveWidth(170),
    backgroundColor: 'rgba(20,20,20,0.96)',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 6},
    elevation: 12,
  },

  menuItem: {
    paddingVertical: 13,
    paddingHorizontal: 14,
  },

  menuText: {
    color: '#fff',
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(13),
  },

  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.18)',
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
});
