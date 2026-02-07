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
  Image,
} from 'react-native';
import Video from 'react-native-video';
import FastImage from '@d11/react-native-fast-image';

import RNFS from 'react-native-fs';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';

import {
  getResponsiveFontSize,
  getResponsiveWidth,
} from '../../../utils/responsive';
import ToastModal from '../../../components/modal/ToastModal';

import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

// ✅ 추가: 폰트모드 구독
import {useSelector} from 'react-redux';
import {FONT_MODE} from 'store/uiSlice';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

/* ================= utils ================= */

const CLOUDFRONT_DOMAIN = 'https://dzqa9jgkeds0b.cloudfront.net';
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

const toNumberSafe = v => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

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

function ZoomableImage({uri, isActive, styles}) {
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
            fallback={true}
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
/**
 * ✅ 지원 형태
 * 1) (신규) mediaItems: [{ kind: 'IMAGE'|'VIDEO', url: string, thumb?: string }]
 * 2) (기존) mediaUrls: string[], mediaType: 'image'|'video'
 */
export default function MediaModal({
  visible,
  mediaItems = null,
  mediaUrls = [],
  mediaType = 'image',
  initialIndex = 0,
  onClose,
}) {
  // ✅ 폰트모드 구독 (이게 있어야 “모드 변경 → 리렌더” 확정)
  const fontMode = useSelector(state => state.ui.fontMode);

  // ✅ multiplier
  const fontMul = useMemo(() => {
    if (fontMode === FONT_MODE.EXTRA_LARGE) return 1.22;
    if (fontMode === FONT_MODE.LARGE) return 1.12;
    return 1.0;
  }, [fontMode]);

  // ✅ 폰트 사이즈 함수
  const rf = useCallback(
    n => Math.round(getResponsiveFontSize(n) * fontMul),
    [fontMul],
  );

  // ✅ styles 재생성
  const styles = useMemo(() => makeStyles(rf), [rf]);

  const cancelRequestedRef = useRef(false);
  const listRef = useRef(null);

  const resolvedItems = useMemo(() => {
    if (Array.isArray(mediaItems) && mediaItems.length > 0) {
      return mediaItems
        .map(it => {
          const kind = String(it?.kind || '').toUpperCase();
          const url = toCdnUrl(it?.url);
          if (!url) return null;
          if (kind !== 'IMAGE' && kind !== 'VIDEO') return null;
          return {
            kind,
            url,
            thumb: toCdnUrl(it?.thumb) || url,
          };
        })
        .filter(Boolean);
    }

    const urls = (Array.isArray(mediaUrls) ? mediaUrls : [])
      .map(toCdnUrl)
      .filter(Boolean);

    const kind = mediaType === 'video' ? 'VIDEO' : 'IMAGE';
    return urls.map(u => ({kind, url: u, thumb: u}));
  }, [mediaItems, mediaUrls, mediaType]);

  const safeInitialIndex = useMemo(() => {
    if (!resolvedItems.length) return 0;
    const n = Math.floor(toNumberSafe(initialIndex));
    return clamp(n, 0, resolvedItems.length - 1);
  }, [initialIndex, resolvedItems.length]);

  const [currentIndex, setCurrentIndex] = useState(safeInitialIndex);

  useEffect(() => {
    setCurrentIndex(() => {
      if (!resolvedItems.length) return 0;
      return clamp(safeInitialIndex, 0, resolvedItems.length - 1);
    });
  }, [safeInitialIndex, resolvedItems.length]);

  useEffect(() => {
    if (!visible) return;
    if (!resolvedItems.length) return;

    requestAnimationFrame(() => {
      try {
        listRef.current?.scrollToOffset?.({
          offset: currentIndex * screenWidth,
          animated: false,
        });
      } catch {
        null;
      }
    });
  }, [visible, currentIndex, resolvedItems.length]);

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
    if (saving || !resolvedItems.length) return;
    setMenuVisible(true);
    menuAnim.value = withTiming(1, {duration: 140});
  }, [saving, resolvedItems.length, menuAnim]);

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
    if (menuVisible) closeMenu();

    if (saving) {
      cancelRequestedRef.current = true;
      setSaving(false);
      setTimeout(() => onClose?.(), 300);
      return;
    }
    onClose?.();
  }, [saving, onClose, menuVisible, closeMenu]);

  const currentItem = resolvedItems[currentIndex] || null;
  const currentKind = currentItem?.kind || 'IMAGE';

  const runSave = useCallback(
    async mode => {
      if (saving || !resolvedItems.length) return;

      setSaving(true);
      cancelRequestedRef.current = false;

      const total = mode === 'all' ? resolvedItems.length : 1;
      setProgress({current: 0, total});

      try {
        const ok = await ensureAndroidPermission();
        if (!ok) throw new Error('permission');

        if (mode === 'single') {
          const target = resolvedItems[currentIndex];
          if (!target?.url) throw new Error('no_target');

          setProgress({current: 1, total: 1});
          await saveUrlToGallery({
            url: target.url,
            type: target.kind === 'VIDEO' ? 'video' : 'photo',
          });

          showToast(
            target.kind === 'VIDEO' ? '영상이 저장됐어요' : '사진이 저장됐어요',
          );
        } else {
          for (let i = 0; i < resolvedItems.length; i++) {
            if (cancelRequestedRef.current) throw new Error('cancel');

            const target = resolvedItems[i];
            if (!target?.url) continue;

            setProgress({current: i + 1, total: resolvedItems.length});
            await saveUrlToGallery({
              url: target.url,
              type: target.kind === 'VIDEO' ? 'video' : 'photo',
            });
          }

          const allSame =
            resolvedItems.every(x => x.kind === 'VIDEO') ||
            resolvedItems.every(x => x.kind === 'IMAGE');

          if (!allSame) showToast('미디어가 모두 저장됐어요');
          else
            showToast(
              resolvedItems[0].kind === 'VIDEO'
                ? '영상이 모두 저장됐어요'
                : '사진이 모두 저장됐어요',
            );
        }
      } catch (e) {
        // 실패/취소는 조용히 종료
      } finally {
        setTimeout(() => {
          setSaving(false);
          setProgress({current: 0, total: 0});
        }, 600);
      }
    },
    [saving, resolvedItems, currentIndex, showToast],
  );

  useEffect(() => {
    if (!visible) {
      setMenuVisible(false);
      menuAnim.value = 0;
    }
  }, [visible, menuAnim]);

  const isMenuDisabled = saving || !resolvedItems.length;

  const renderItem = useCallback(
    ({item, index}) => {
      if (item.kind === 'VIDEO') {
        return <Video source={{uri: item.url}} style={styles.video} controls />;
      }
      return (
        <ZoomableImage
          uri={item.url}
          isActive={index === currentIndex}
          styles={styles}
        />
      );
    },
    [currentIndex, styles],
  );

  const singleLabel =
    currentKind === 'VIDEO' ? '영상 개별저장' : '사진 개별저장';

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleClose}>
      <View style={styles.overlay} />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleClose} style={styles.circleIconBtn}>
          <Text allowFontScaling={false} style={styles.xText}>
            ✕
          </Text>
        </TouchableOpacity>

        <View style={styles.indexPill}>
          <Text allowFontScaling={false} style={styles.indexText}>
            {resolvedItems.length ? currentIndex + 1 : 0} /{' '}
            {resolvedItems.length}
          </Text>
        </View>

        <TouchableOpacity
          onPress={openMenu}
          disabled={isMenuDisabled}
          style={[styles.circleIconBtn, isMenuDisabled && {opacity: 0.5}]}>
          <Image
            source={require('../../../assets/images/dots_white.png')}
            style={styles.dotsIcon}
            // resizeMode={FastImage.resizeMode.contain}
          />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        data={resolvedItems}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        extraData={currentIndex}
        keyExtractor={(v, i) => `${v.url}_${i}`}
        getItemLayout={(_, i) => ({
          length: screenWidth,
          offset: screenWidth * i,
          index: i,
        })}
        renderItem={renderItem}
        onMomentumScrollEnd={e => {
          const raw = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
          const next = resolvedItems.length
            ? clamp(raw, 0, resolvedItems.length - 1)
            : 0;
          setCurrentIndex(next);
        }}
      />

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
            disabled={saving || !resolvedItems[currentIndex]?.url}
            activeOpacity={0.85}
            style={[
              styles.menuItem,
              (saving || !resolvedItems[currentIndex]?.url) && {opacity: 0.5},
            ]}>
            <Text allowFontScaling={false} style={styles.menuText}>
              {singleLabel}
            </Text>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            onPress={() => {
              closeMenu();
              runSave('all');
            }}
            disabled={saving || !resolvedItems.length}
            activeOpacity={0.85}
            style={[
              styles.menuItem,
              (saving || !resolvedItems.length) && {opacity: 0.5},
            ]}>
            <Text allowFontScaling={false} style={styles.menuText}>
              전체저장
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {saving && (
        <View style={styles.progressOverlay}>
          <View style={styles.progressBox}>
            <ActivityIndicator size="large" color="#fff" />
            <Text allowFontScaling={false} style={styles.progressText}>
              {progress.current} / {progress.total}
            </Text>
            <Text allowFontScaling={false} style={styles.progressSub}>
              화면을 나가면 저장이 취소돼요
            </Text>
          </View>
        </View>
      )}

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

const makeStyles = rf =>
  StyleSheet.create({
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

    xText: {
      color: '#fff',
      fontSize: rf(16),
      textAlign: 'center',
      textAlignVertical: 'center',
      lineHeight: rf(17),
      fontFamily: 'Pretendard-SemiBold',
      includeFontPadding: false,
    },

    dotsIcon: {
      width: getResponsiveWidth(16),
      height: getResponsiveWidth(16),
      resizeMode: 'contain',
    },

    indexPill: {
      paddingHorizontal: getResponsiveWidth(12),
      height: CIRCLE_SIZE,
      borderRadius: 999,
      backgroundColor: 'rgba(0,0,0,0.45)',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: getResponsiveWidth(92),
    },

    indexText: {
      color: '#fff',
      fontSize: rf(13),
      fontFamily: 'Pretendard-SemiBold',
      includeFontPadding: false,
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
      fontSize: rf(13),
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
      fontSize: rf(16),
      marginTop: 12,
      fontFamily: 'Pretendard-SemiBold',
    },

    progressSub: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: rf(12),
      marginTop: 8,
      fontFamily: 'Pretendard-Medium',
    },
  });
