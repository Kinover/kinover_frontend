// 변경 포인트
// 1) 순서칩(orderChip) : 투명 검정 알약 -> "글래스(반투명)+화이트 보더+살짝 블러 느낌" 스타일
// 2) X 버튼(removeBtn) : 더 작고, 깔끔한 라운드+보더, "×" 위치/두께 정리

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import AppText from 'components/AppText';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import { View, Platform, Image, Dimensions, Pressable } from 'react-native';
import SpringPressable from 'components/SpringPressable';
import FastImage from '@d11/react-native-fast-image';
import {useNavigation, useRoute} from '@react-navigation/native';
import {launchImageLibrary} from 'react-native-image-picker';
import DraggableFlatList from 'react-native-draggable-flatlist';

import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveIconSize,
} from 'utils/responsive';

import useHideTabBar from 'hooks/useHideTabBar';
import ToastModal from 'components/modal/ToastModal';
import {HEADER_STYLES} from 'styles/style';
import {useColors, useIsDark} from 'hooks/useColors';

import {
  convertPhUriToFileUri,
  convertContentUriToFileUri,
} from 'utils/photoUriConverter';

import {requestMediaPermission} from 'utils/requestMediaPermission';
import {useGetPostByIdQuery} from '../services/memoryApi';

import {useSelector} from 'react-redux';

import MediaViewer from '../components/media/MediaViewer';
import {getVideoThumbnail} from 'utils/videoThumbnail';
import formatDuration from 'utils/formatDuration';
import {FONTS} from 'styles/typography';

const MAX_SELECTION = 30;

const GRID_COLS = 3;
const GRID_GAP = getResponsiveWidth(8);
const H_PADDING = getResponsiveWidth(14);
const {width: SCREEN_W} = Dimensions.get('window');

const ITEM_SIZE =
  (SCREEN_W - H_PADDING * 2 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

const PLUS_TILE_ID = '__PLUS_TILE__';

const TILE_R = getResponsiveIconSize(14);
const PILL_R = 999;

export default function ImageSelectPage() {
  const colors = useColors();
  const isDark = useIsDark();
  const headerTheme = useMemo(() => HEADER_STYLES.get(colors), [colors]);
  const C = useMemo(
    () => ({
      bg: isDark ? colors.surfaceSecondary : '#F6F7FB',
      text: colors.textPrimary,
      sub: colors.textSecondary,
      lineStrong: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(17,24,39,0.12)',
      chipGlass: isDark ? 'rgba(255,255,255,0.30)' : 'rgba(17,24,39,0.38)',
      chipGlass2: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(17,24,39,0.26)',
      plusBg: colors.surfacePrimary,
      tileBg: isDark ? colors.surfaceMuted : '#EDEFF4',
      tileBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(17,24,39,0.06)',
      plusIconCircleBg: isDark ? colors.surfaceMuted : '#F9FAFB',
    }),
    [colors, isDark],
  );

  const headerIconTint = isDark ? '#FFFFFF' : '#111827';

  const styles = useScaledStyleSheet(
    rf => ({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    paddingHorizontal: H_PADDING,
    paddingTop: getResponsiveHeight(12),
  },

  headerTitle: {
    fontSize: headerTheme.defaultTitleFontSize,
    fontFamily: headerTheme.defaultTitleFontFamily,
    color: headerTheme.defaultTitleFontColor,
    lineHeight: getResponsiveHeight(26),
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  headerRightBtn: {
    paddingVertical: getResponsiveHeight(6),
  },
  checkIcon: {
    width: HEADER_STYLES().headerRightIconWidth,
    height: HEADER_STYLES().headerRightIconHeight,
    marginRight: HEADER_STYLES().headerRightIconRightPadding,
    resizeMode: 'contain',
  },

  grid: {paddingBottom: GRID_GAP / 2},
  row: {
    justifyContent: 'flex-start',
    columnGap: GRID_GAP,
    marginBottom: GRID_GAP,
  },

  tile: {
    position: 'relative',
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: TILE_R,
    overflow: 'hidden',
    backgroundColor: C.tileBg,
    borderWidth: 1,
    borderColor: C.tileBorder,
  },
  tileActive: {
    opacity: 0.95,
    transform: [{scale: 0.99}],
  },
  tileImage: {width: '100%', height: '100%'},
  thumbFallback: {
    backgroundColor: C.tileBg,
  },
  placeholder: {width: ITEM_SIZE, height: ITEM_SIZE, opacity: 0},

  plusTile: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: TILE_R,
    borderWidth: 1,
    borderColor: C.lineStrong,
    backgroundColor: C.plusBg,
    overflow: 'hidden',
  },
  plusInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: getResponsiveHeight(6),
  },
  plusIconCircle: {
    width: getResponsiveWidth(44),
    height: getResponsiveWidth(44),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.lineStrong,
    backgroundColor: C.plusIconCircleBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusIcon: {
    fontSize: rf(22),
    fontFamily: FONTS.BOLD,
    color: C.text,
    lineHeight: rf(24),
  },
  plusSubText: {
    fontSize: rf(12.8),
    fontFamily: FONTS.SEMI_BOLD,
    color: C.text,
    letterSpacing: -0.1,
  },
  plusHint: {
    marginTop: getResponsiveHeight(-2),
    fontSize: rf(11),
    fontFamily: FONTS.MEDIUM,
    color: C.sub,
  },

 /* =================== 여기부터 “꾸민” 부분 =================== */

 // 순서칩: 글래스 알약 + 얇은 화이트 보더
  orderChip: {
    position: 'absolute',
    top: getResponsiveHeight(7),
    left: getResponsiveWidth(7),
    minWidth: getResponsiveWidth(22),
    height: getResponsiveWidth(22),
    paddingHorizontal: getResponsiveWidth(7),
    borderRadius: PILL_R,
    backgroundColor: C.chipGlass,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
 // ios: {
 // shadowColor: '#000',
 // shadowOpacity: 0.14,
 // shadowRadius: 8,
 // shadowOffset: {width: 0, height: 4},
 // },
 // android: {elevation: 2},
    }),
  },
  orderChipText: {
    fontSize: rf(12),
    fontFamily: FONTS.SEMI_BOLD,
    color: '#FFF',
    letterSpacing: -0.2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  remoteTag: {
    position: 'absolute',
    left: getResponsiveWidth(7),
    top: getResponsiveHeight(7),
    paddingHorizontal: getResponsiveWidth(9),
    height: getResponsiveWidth(22),
    borderRadius: PILL_R,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  remoteTagText: {
    color: 'rgba(17,24,39,0.78)',
    fontSize: rf(10.5),
    fontFamily: FONTS.SEMI_BOLD,
    letterSpacing: -0.2,
    includeFontPadding: false,
  },

  videoPill: {
    position: 'absolute',
    bottom: getResponsiveHeight(7),
    right: getResponsiveWidth(7),
    height: getResponsiveWidth(22),
    paddingHorizontal: getResponsiveWidth(10),
    borderRadius: PILL_R,
    backgroundColor: C.chipGlass2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPillText: {
    fontSize: rf(10.2),
    fontFamily: FONTS.SEMI_BOLD,
    color: '#fff',
    letterSpacing: 0.4,
    includeFontPadding: false,
  },

 // X 버튼: 크기/보더/텍스트 정렬 “깔끔”
  removeBtn: {
    position: 'absolute',
    right: getResponsiveWidth(7),
    top: getResponsiveHeight(7),
    width: getResponsiveWidth(22),
    height: getResponsiveWidth(22),
    borderRadius: 999,
    backgroundColor: 'rgba(17,24,39,0.44)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
 // ios: {
 // shadowColor: '#000',
 // shadowOpacity: 0.18,
 // shadowRadius: 8,
 // shadowOffset: {width: 0, height: 4},
 // },
 // android: {elevation: 2},
    }),
  },
  removeBtnText: {
    color: '#fff',
    fontSize: rf(12.8),
    fontFamily: FONTS.SEMI_BOLD,
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: rf(13),
 // 폰트 렌더링 때문에 살짝 위로 뜨는 경우가 있어서 보정
  },

 /* =================== 여기까지 =================== */

  helperBox: {
    marginTop: getResponsiveHeight(12),
    paddingVertical: getResponsiveHeight(10),
    alignItems: 'center',
  },
  helperText: {
    fontSize: rf(12.5),
    fontFamily: FONTS.MEDIUM,
    color: C.sub,
  },

  }),
    [C, headerTheme],
  );
  const navigation = useNavigation();
  const route = useRoute();
  const {postId = null, mode = '등록'} = route?.params || {};
  const isEditMode = mode === '수정';

  const fallbackPostFromStore = useSelector(state =>
    postId ? state.memory?.postsById?.[postId] : null,
  );
  const {data: postQueryData} = useGetPostByIdQuery(postId, {skip: !postId});
  const postFromStore = postQueryData ?? fallbackPostFromStore;

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [removedUrls, setRemovedUrls] = useState([]);
  const [previewIndex, setPreviewIndex] = useState(null);
  const [videoThumbMap, setVideoThumbMap] = useState({});
  const thumbLoadingRef = useRef(new Set());

  const showToast = useCallback(msg => {
    setToastMessage(msg);
    setToastVisible(true);
  }, []);
  const hideToast = useCallback(() => setToastVisible(false), []);

  const ensureVideoThumb = useCallback(
    async item => {
      try {
        if (!item?.isVideo) return;
        const uri = item?.uri;
        if (!uri) return;
        if (videoThumbMap[uri]) return;
        if (thumbLoadingRef.current.has(uri)) return;
        thumbLoadingRef.current.add(uri);
        const t = await getVideoThumbnail(uri);
        const thumbUri = t?.uri || null;
        if (thumbUri) {
          setVideoThumbMap(prev => ({...prev, [uri]: thumbUri}));
        }
      } catch {
        // ignore
      } finally {
        const u = item?.uri;
        if (u) thumbLoadingRef.current.delete(u);
      }
    },
    [videoThumbMap],
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      const list = Array.isArray(selectedFiles) ? selectedFiles : [];
      for (const it of list) {
        if (!alive) break;
        if (!it?.isVideo) continue;
        await ensureVideoThumb(it);
      }
    })();
    return () => {
      alive = false;
    };
  }, [selectedFiles, ensureVideoThumb]);

  useHideTabBar();

  const getExt = useCallback((uri, fileName, isVideo) => {
    const fromFileName = (fileName || '').split('?')[0].split('.').pop();
    if (fromFileName && fromFileName.length <= 6)
      return fromFileName.toLowerCase();
    try {
      const clean = (uri || '').split('?')[0];
      const ext = clean.split('.').pop()?.toLowerCase();
      if (!ext || ext.includes('/') || ext.length > 6)
        return isVideo ? 'mp4' : 'jpg';
      return ext;
    } catch {
      return isVideo ? 'mp4' : 'jpg';
    }
  }, []);

  const extToMime = useCallback(ext => {
    const e = (ext || '').toLowerCase();
    if (e === 'jpg' || e === 'jpeg') return 'image/jpeg';
    if (e === 'png') return 'image/png';
    if (e === 'webp') return 'image/webp';
    if (e === 'mp4') return 'video/mp4';
    if (e === 'mov') return 'video/quicktime';
    return 'application/octet-stream';
  }, []);

  const makeRemoteItem = useCallback((url, i) => {
    const lower = String(url || '').toLowerCase();
    const isVideo =
      lower.includes('.mp4') ||
      lower.includes('.mov') ||
      lower.includes('.m4v');

    return {
      id: `remote-${i}-${url}`,
      uri: url,
      isVideo,
      duration: 0,
      ext: isVideo ? 'mp4' : 'jpg',
      mimeType: isVideo ? 'video/mp4' : 'image/jpeg',
      isRemote: true,
    };
  }, []);

  const didInitRef = useRef(false);
  useEffect(() => {
    if (!isEditMode) return;
    if (!postId) return;
    if (!postFromStore) return;
    if (didInitRef.current) return;

    const urls = Array.isArray(postFromStore?.imageUrls)
      ? postFromStore.imageUrls
      : Array.isArray(postFromStore?.images)
      ? postFromStore.images.map(x => x?.imageUrl).filter(Boolean)
      : [];

    setSelectedFiles(urls.map((u, i) => makeRemoteItem(u, i)));
    setRemovedUrls([]);
    didInitRef.current = true;
    setHasOpenedOnce(true);
  }, [isEditMode, postId, postFromStore, makeRemoteItem]);

  useEffect(() => {
    didInitRef.current = false;
  }, [postId]);

  const openSystemAlbum = useCallback(async () => {
    const hasPermission = await requestMediaPermission();
    if (!hasPermission) {
      showToast('사진 접근 권한이 필요해요.');
      return;
    }

    const remain = Math.max(0, MAX_SELECTION - selectedFiles.length);
    if (remain <= 0) {
      showToast(`최대 ${MAX_SELECTION}개까지 선택할 수 있어요.`);
      return;
    }

    const res = await launchImageLibrary({
      mediaType: 'mixed',
      selectionLimit: remain,
      includeExtra: true,
      quality: 1,
    });

    if (res.didCancel) {
      if (!isEditMode && (!selectedFiles || selectedFiles.length === 0)) {
        navigation.goBack();
      }
      return;
    }

    if (res.errorCode) {
      showToast(res.errorMessage || '갤러리를 열 수 없어요.');
      return;
    }

    const assets = res.assets || [];
    if (assets.length === 0) {
      showToast('선택된 항목이 없어요.');
      return;
    }

    const converted = [];

    for (let i = 0; i < assets.length; i++) {
      const a = assets[i];

      let uri = a.uri || '';
      const type = a.type || '';
      const duration = typeof a.duration === 'number' ? a.duration : 0;

      const isVideo =
        type.startsWith('video') ||
        (!type && duration > 0) ||
        (uri || '').toLowerCase().includes('.mp4') ||
        (uri || '').toLowerCase().includes('.mov');

      if (Platform.OS === 'ios' && uri.startsWith('ph://')) {
        const fixed = await convertPhUriToFileUri(uri, i, isVideo);
        if (fixed) uri = fixed;
      } else if (Platform.OS === 'android' && uri.startsWith('content://')) {
        const fixed = await convertContentUriToFileUri(uri, i, isVideo);
        if (fixed) uri = fixed;
      }

      const ext = getExt(uri, a.fileName, isVideo);
      const mimeType = type || extToMime(ext);

      converted.push({
        id: `${uri}-${Date.now()}-${i}`,
        uri,
        isVideo: !!isVideo,
        duration: duration ?? 0,
        ext,
        mimeType,
        isRemote: false,
      });
    }

    setSelectedFiles(prev => {
      const prevArr = Array.isArray(prev) ? prev : [];
      const next = [...prevArr, ...converted];

      const seen = new Set();
      const dedup = [];
      for (const it of next) {
        const key = String(it?.uri || it?.id || '');
        if (!key) continue;
        if (seen.has(key)) continue;
        seen.add(key);
        dedup.push(it);
      }

 // 최대 30개 제한도 한 번 더 안전장치
      return dedup.slice(0, MAX_SELECTION);
    });
  }, [extToMime, getExt, navigation, selectedFiles, showToast, isEditMode]);

  useEffect(() => {
    if (isEditMode) return;
    if (hasOpenedOnce) return;
    setHasOpenedOnce(true);
    openSystemAlbum();
  }, [hasOpenedOnce, openSystemAlbum, isEditMode]);

  const goNext = useCallback(() => {
    if (!selectedFiles || selectedFiles.length === 0) {
      showToast('먼저 사진/동영상을 선택해줘요!');
      return;
    }

    navigation.navigate('카테고리선택화면', {
      selectedImages: selectedFiles.map(({id: _clientId, ...rest}) => rest),
      from: '이미지선택화면',
      mode: isEditMode ? '수정' : '등록',
      postId: isEditMode ? postId : null,
      removedUrls: isEditMode ? removedUrls : [],
    });
  }, [navigation, selectedFiles, showToast, isEditMode, postId, removedUrls]);

  const hasSelection = selectedFiles.length > 0;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <AppText style={styles.headerTitle}>
          {isEditMode ? '미디어 수정' : '사진 업로드'}{' '}
          {hasSelection ? `(${selectedFiles.length})` : ''}
        </AppText>
      ),
      headerRight: () => (
        <SpringPressable
          onPress={goNext}
          disabled={!hasSelection}
          style={[styles.headerRightBtn, !hasSelection && {opacity: 0.35}]}
          activeOpacity={0.85}>
          <Image
            source={require('../../../assets/icons/check.png')}
            style={[styles.checkIcon, {tintColor: headerIconTint}]}
          />
        </SpringPressable>
      ),
    });
  }, [goNext, hasSelection, headerIconTint, navigation, selectedFiles.length, isEditMode, styles]);

  const canAddMore = selectedFiles.length < MAX_SELECTION;

  const listData = useMemo(() => {
    const base = Array.isArray(selectedFiles) ? selectedFiles : [];
    if (!canAddMore) return base;

    return [
      ...base,
      {
        id: PLUS_TILE_ID,
        isPlus: true,
      },
    ];
  }, [selectedFiles, canAddMore]);

  const getOrder = useCallback(
    item => {
      if (item?.isPlus) return '';
      const idx = selectedFiles.findIndex(f => f.id === item.id);
      return idx >= 0 ? idx + 1 : '';
    },
    [selectedFiles],
  );

  const viewerMedia = useMemo(() => {
    return (selectedFiles || []).map(it => ({
      uri: it?.uri,
      type: it?.isVideo ? 'video' : 'photo',
    }));
  }, [selectedFiles]);

  const renderSelectedItem = useCallback(
    ({item, drag, isActive}) => {
      if (item?.isPlus) {
        return (
          <Pressable
            onPress={openSystemAlbum}
            style={({pressed}) => [
              styles.plusTile,
              (pressed || isActive) && styles.tileActive,
            ]}>
            <View style={styles.plusInner}>
              <View style={styles.plusIconCircle}>
                <AppText style={styles.plusIcon}>
                  ＋
                </AppText>
              </View>
              <AppText style={styles.plusSubText}>
                추가하기
              </AppText>
              <AppText style={styles.plusHint}>
                {selectedFiles.length}/{MAX_SELECTION}
              </AppText>
            </View>
          </Pressable>
        );
      }

      const order = getOrder(item);
      const thumbUri =
        item.isVideo && item.uri ? videoThumbMap[item.uri] : null;

      return (
        <Pressable
          onPress={() => {
            const idx = selectedFiles.findIndex(f => f.id === item.id);
            setPreviewIndex(idx >= 0 ? idx : 0);
          }}
          onLongPress={drag}
          delayLongPress={220}
          style={({pressed}) => [
            styles.tile,
            (pressed || isActive) && styles.tileActive,
          ]}>
          {item.isVideo ? (
            thumbUri ? (
              <FastImage
                source={{
                  uri: thumbUri,
                  priority: FastImage.priority.normal,
                  cache: FastImage.cacheControl.immutable,
                }}
                style={styles.tileImage}
                resizeMode={FastImage.resizeMode.cover}
              />
            ) : (
              <View style={[styles.tileImage, styles.thumbFallback]} />
            )
          ) : (
            <Image
              source={{uri: item.uri}}
              style={styles.tileImage}
              resizeMode="cover"
            />
          )}

          {/* 순서칩(예쁘게) */}
          <View style={styles.orderChip}>
            <AppText style={styles.orderChipText}>
              {order}
            </AppText>
          </View>

          {/* 비디오 칩 */}
          {item.isVideo ? (
            <View style={styles.videoPill}>
              <AppText style={styles.videoPillText}>
                {item.duration > 0 ? formatDuration(item.duration) : 'VIDEO'}
              </AppText>
            </View>
          ) : null}

          {/* X 버튼(예쁘게) */}
          <SpringPressable
            onPress={() => {
              setSelectedFiles(prev => prev.filter(x => x.id !== item.id));

              if (isEditMode && item.isRemote && item.uri) {
                setRemovedUrls(prev => {
                  if (prev.includes(item.uri)) return prev;
                  return [...prev, item.uri];
                });
              }

              setPreviewIndex(prev => {
                if (prev == null) return null;
                const nowIdx = selectedFiles.findIndex(f => f.id === item.id);
                if (nowIdx === prev) return null;
                return prev;
              });
            }}
            activeOpacity={0.85}
            style={styles.removeBtn}>
            <AppText style={styles.removeBtnText}>
              ✕
            </AppText>
          </SpringPressable>
        </Pressable>
      );
    },
    [getOrder, selectedFiles, isEditMode, openSystemAlbum, videoThumbMap],
  );

  return (
    <View style={styles.container}>
      <DraggableFlatList
        data={listData}
        keyExtractor={item => String(item.id)}
        onDragEnd={({data}) => {
          const real = (data || []).filter(x => !x?.isPlus);
          setSelectedFiles(real);
        }}
        renderItem={renderSelectedItem}
        numColumns={GRID_COLS}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        dragItemOverflow
        autoscrollSpeed={80}
        renderPlaceholder={() => <View style={styles.placeholder} />}
      />

      {!hasSelection && (
        <View style={styles.helperBox}>
          <AppText style={styles.helperText}>
            오른쪽 ‘추가하기’ 타일을 눌러 미디어를 선택해줘요
          </AppText>
        </View>
      )}

      <MediaViewer
        visible={previewIndex !== null}
        media={viewerMedia}
        index={previewIndex ?? 0}
        onIndexChange={idx => setPreviewIndex(idx)}
        onClose={() => setPreviewIndex(null)}
      />

      <ToastModal
        visible={toastVisible}
        onClose={hideToast}
        message={toastMessage}
      />
    </View>
  );
}

