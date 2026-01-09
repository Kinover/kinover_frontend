import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  Dimensions,
  Pressable,
  Modal,
  FlatList,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {launchImageLibrary} from 'react-native-image-picker';
import DraggableFlatList from 'react-native-draggable-flatlist';

import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
} from '../../../utils/responsive';

import useHideTabBar from '../../../hooks/useHideTabBar';
import ToastModal from '../../../components/ToastModal';
import {EMPTY_STYLE, HEADER_STYLES} from 'styles/style';

import {
  convertPhUriToFileUri,
  convertContentUriToFileUri,
} from '../../../utils/photoUriConverter';

import {requestMediaPermission} from 'utils/requestMediaPermission';

// ✅ redux
import {useDispatch, useSelector} from 'react-redux';
import {fetchPostByIdThunk} from '../store/memoryThunk';

const MAX_SELECTION = 30;

const GRID_COLS = 3;
const GRID_GAP = getResponsiveWidth(2);
const H_PADDING = getResponsiveWidth(2);
const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');

const ITEM_SIZE =
  (SCREEN_W - H_PADDING * 2 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

// ✅ 그리드에 들어갈 “+ 타일” 가짜 아이템
const PLUS_TILE_ID = '__PLUS_TILE__';

export default function ImageSelectPage() {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();

  const {postId = null, mode = '등록'} = route?.params || {};
  const isEditMode = mode === '수정';

  const postFromStore = useSelector(state =>
    postId ? state.memory?.postsById?.[postId] : null,
  );

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);

  // ✅ 실제 선택된 파일(원격 + 로컬)
  const [selectedFiles, setSelectedFiles] = useState([]);

  // ✅ 수정 모드에서 “삭제된 기존 이미지 url”
  const [removedUrls, setRemovedUrls] = useState([]);

  // ✅ 프리뷰
  const [previewIndex, setPreviewIndex] = useState(null);

  const showToast = useCallback(msg => {
    setToastMessage(msg);
    setToastVisible(true);
  }, []);
  const hideToast = useCallback(() => setToastVisible(false), []);

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
      lower.includes('.mp4') || lower.includes('.mov') || lower.includes('.m4v');

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

  /** ---------------- 수정 모드: post fetch ---------------- */
  useEffect(() => {
    if (!isEditMode) return;
    if (!postId) return;
    if (!postFromStore) dispatch(fetchPostByIdThunk(postId));
  }, [dispatch, isEditMode, postId, postFromStore]);

  /** ---------------- 수정 모드: 기존 이미지 세팅 ---------------- */
  const didInitRef = useRef(false);
  useEffect(() => {
    if (!isEditMode) return;
    if (!postId) return;
    if (!postFromStore) return;
    if (didInitRef.current) return;

    const urls =
      Array.isArray(postFromStore?.imageUrls)
        ? postFromStore.imageUrls
        : Array.isArray(postFromStore?.images)
        ? postFromStore.images.map(x => x?.imageUrl).filter(Boolean)
        : [];

    setSelectedFiles(urls.map((u, i) => makeRemoteItem(u, i)));
    setRemovedUrls([]);
    didInitRef.current = true;

    // ✅ 수정모드: 자동 갤러리 오픈 X
    setHasOpenedOnce(true);
  }, [isEditMode, postId, postFromStore, makeRemoteItem]);

  useEffect(() => {
    didInitRef.current = false;
  }, [postId]);

  /** ---------------- 갤러리 열기 (+ 타일이 이걸 호출) ---------------- */
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
      // ✅ 등록모드 & 아무것도 선택 안 했으면 뒤로
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

    // ✅ 수정모드: 추가 / 등록모드: 교체(원래 로직 유지)
    setSelectedFiles(prev => (isEditMode ? [...prev, ...converted] : converted));
  }, [
    extToMime,
    getExt,
    navigation,
    selectedFiles,
    showToast,
    isEditMode,
  ]);

  /** ---------------- 등록 모드만 첫 진입 자동 오픈 ---------------- */
  useEffect(() => {
    if (isEditMode) return;
    if (hasOpenedOnce) return;
    setHasOpenedOnce(true);
    openSystemAlbum();
  }, [hasOpenedOnce, openSystemAlbum, isEditMode]);

  /** ---------------- 체크 눌러 다음으로 ---------------- */
  const goNext = useCallback(() => {
    if (!selectedFiles || selectedFiles.length === 0) {
      showToast('먼저 사진/동영상을 선택해줘요!');
      return;
    }

    navigation.navigate('카테고리선택화면', {
      selectedImages: selectedFiles.map(({id, ...rest}) => rest),
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
        <Text style={styles.headerTitle}>
          {isEditMode ? '미디어 수정' : '사진 업로드'}{' '}
          {hasSelection ? `(${selectedFiles.length})` : ''}
        </Text>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={goNext}
          disabled={!hasSelection}
          style={[styles.headerRightBtn, !hasSelection && {opacity: 0.35}]}
          activeOpacity={0.85}>
          <Image
            source={require('../../../assets/icons/check.png')}
            style={styles.checkIcon}
          />
        </TouchableOpacity>
      ),
    });
  }, [goNext, hasSelection, navigation, selectedFiles.length, isEditMode]);

  /** ---------------- + 타일 포함된 리스트 데이터 ---------------- */
  const canAddMore = selectedFiles.length < MAX_SELECTION;

  const listData = useMemo(() => {
    // ✅ 마지막에 + 타일 하나 붙이기 (최대치면 안 붙임)
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

  // ✅ 순서칩: + 타일은 빈값
  const getOrder = useCallback(
    item => {
      if (item?.isPlus) return '';
      const idx = selectedFiles.findIndex(f => f.id === item.id);
      return idx >= 0 ? idx + 1 : '';
    },
    [selectedFiles],
  );

  // ✅ 높이 계산: + 타일까지 포함해서 rows 계산
  const listWrapStyle = useMemo(() => {
    const count = listData.length;
    if (!count) return null;

    const rows = Math.ceil(count / GRID_COLS);
    const contentH = rows * ITEM_SIZE + (rows - 1) * GRID_GAP;

    const maxH = getResponsiveHeight(620);
    return {height: Math.min(contentH, maxH)};
  }, [listData]);

  const onPreviewScrollToIndexFailed = useCallback(() => {
    setTimeout(() => {}, 100);
  }, []);

  /** ---------------- renderItem ---------------- */
  const renderSelectedItem = useCallback(
    ({item, drag, isActive}) => {
      // ✅ + 타일
      if (item?.isPlus) {
        return (
          <Pressable
            onPress={openSystemAlbum}
            style={({pressed}) => [
              styles.plusTile,
              pressed && {opacity: 0.75},
            ]}>
            <Text style={styles.plusText}>+</Text>
            <Text style={styles.plusSubText}>추가</Text>
          </Pressable>
        );
      }

      const order = getOrder(item);

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
          <Image
            source={{uri: item.uri}}
            style={styles.tileImage}
            resizeMode="cover"
          />

          <View style={styles.orderChip}>
            <Text style={styles.orderChipText}>{order}</Text>
          </View>

          {item.isVideo ? (
            <View style={styles.videoPill}>
              <Text style={styles.videoPillText}>VIDEO</Text>
            </View>
          ) : null}

          {isEditMode && item.isRemote ? (
            <View style={styles.remoteTag}>
              <Text style={styles.remoteTagText}>기존</Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={() => {
              setSelectedFiles(prev => prev.filter(x => x.id !== item.id));

              if (isEditMode && item.isRemote && item.uri) {
                setRemovedUrls(prev => {
                  if (prev.includes(item.uri)) return prev;
                  return [...prev, item.uri];
                });
              }
            }}
            activeOpacity={0.85}
            style={styles.removeBtn}>
            <Text style={styles.removeBtnText}>×</Text>
          </TouchableOpacity>
        </Pressable>
      );
    },
    [getOrder, selectedFiles, isEditMode, openSystemAlbum],
  );

  return (
    <View style={styles.container}>
      {/* ✅ 선택이 0이어도 + 타일은 보여야 하니까, emptyBox 없애고 그리드만 사용 */}
      <View style={[styles.listWrap, listWrapStyle]}>
        <DraggableFlatList
          data={listData}
          keyExtractor={item => String(item.id)}
          onDragEnd={({data}) => {
            // ✅ 드래그 결과에서 + 타일 제거하고 실제 데이터만 저장
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
          // ✅ + 타일은 드래그 못하게
          // DraggableFlatList는 개별 disable이 애매해서, + 타일은 onLongPress에 drag 자체가 안 걸리게(renderItem에서 처리)
        />
      </View>

      {/* ✅ 선택이 0이면 안내문만 아래에 표시 */}
      {!hasSelection && (
        <View style={styles.helperBox}>
          <Text style={styles.helperText}>오른쪽 ‘+’ 칸 눌러서 추가해줘요</Text>
        </View>
      )}

      {/* ✅ 전체화면 프리뷰 */}
      <Modal
        visible={previewIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewIndex(null)}>
        <View style={styles.previewOverlay}>
          <FlatList
            data={selectedFiles}
            horizontal
            pagingEnabled
            initialScrollIndex={previewIndex ?? 0}
            keyExtractor={item => item.id}
            onScrollToIndexFailed={onPreviewScrollToIndexFailed}
            renderItem={({item}) => (
              <View style={styles.previewPage}>
                <Image
                  source={{uri: item.uri}}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
                {item.isVideo ? (
                  <View style={styles.previewVideoHint}>
                    <Text style={styles.previewVideoHintText}>
                      VIDEO (미리보기)
                    </Text>
                  </View>
                ) : null}
              </View>
            )}
          />

          <Pressable
            style={styles.previewClose}
            onPress={() => setPreviewIndex(null)}>
            <Text style={styles.previewCloseText}>닫기</Text>
          </Pressable>
        </View>
      </Modal>

      <ToastModal
        visible={toastVisible}
        onClose={hideToast}
        message={toastMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: H_PADDING,
    paddingTop: getResponsiveHeight(10),
  },

  headerTitle: {
    fontSize: HEADER_STYLES.defaultTitleFontSize,
    fontFamily: HEADER_STYLES.defaultTitleFontFamily,
    color: HEADER_STYLES.defaultTitleFontColor,
    lineHeight: getResponsiveHeight(26),
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  headerRightBtn: {
    paddingVertical: getResponsiveHeight(6),
  },
  checkIcon: {
    width: HEADER_STYLES.headerRightIconWidth,
    height: HEADER_STYLES.headerRightIconHeight,
    marginRight: HEADER_STYLES.headerRightIconRightPadding,
    resizeMode: 'contain',
  },

  listWrap: {alignSelf: 'stretch'},
  grid: {paddingBottom: GRID_GAP},
  row: {
    justifyContent: 'flex-start',
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },

  tile: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: getResponsiveWidth(3),
    overflow: 'hidden',
    backgroundColor: '#EEE',
  },
  tileActive: {
    opacity: 0.92,
    transform: [{scale: 0.99}],
  },
  tileImage: {width: '100%', height: '100%'},
  placeholder: {width: ITEM_SIZE, height: ITEM_SIZE, opacity: 0},

  // ✅ + 타일 스타일
  plusTile: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: getResponsiveWidth(3),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.18)',
    backgroundColor: '#F6F6F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusText: {
    fontSize: getResponsiveFontSize(34),
    fontWeight: '900',
    color: '#333',
    lineHeight: getResponsiveFontSize(36),
  },
  plusSubText: {
    marginTop: getResponsiveHeight(4),
    fontSize: getResponsiveFontSize(12),
    fontWeight: '800',
    color: '#666',
  },

  orderChip: {
    position: 'absolute',
    top: getResponsiveHeight(6),
    right: getResponsiveWidth(6),
    paddingHorizontal: getResponsiveWidth(6),
    paddingVertical: getResponsiveHeight(3),
    borderRadius: getResponsiveWidth(999),
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  orderChipText: {
    fontSize: getResponsiveFontSize(10),
    fontWeight: '800',
    color: '#FFF',
  },

  videoPill: {
    position: 'absolute',
    bottom: getResponsiveHeight(6),
    right: getResponsiveWidth(6),
    paddingHorizontal: getResponsiveWidth(8),
    paddingVertical: getResponsiveHeight(4),
    borderRadius: getResponsiveWidth(999),
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  videoPillText: {
    fontSize: getResponsiveFontSize(10),
    fontWeight: '900',
    color: '#fff',
  },

  remoteTag: {
    position: 'absolute',
    left: getResponsiveWidth(6),
    top: getResponsiveHeight(6),
    paddingHorizontal: getResponsiveWidth(8),
    paddingVertical: getResponsiveHeight(4),
    borderRadius: getResponsiveWidth(999),
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  remoteTagText: {
    color: '#111',
    fontSize: getResponsiveFontSize(10),
    fontWeight: '900',
  },

  removeBtn: {
    position: 'absolute',
    left: getResponsiveWidth(6),
    bottom: getResponsiveHeight(6),
    width: getResponsiveWidth(24),
    height: getResponsiveWidth(24),
    borderRadius: getResponsiveWidth(999),
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(16),
    fontWeight: '900',
    lineHeight: getResponsiveFontSize(18),
  },

  helperBox: {
    marginTop: getResponsiveHeight(10),
    paddingVertical: getResponsiveHeight(10),
    alignItems: 'center',
  },
  helperText: {
    fontSize: getResponsiveFontSize(12.5),
    fontWeight: '800',
    color: '#666',
  },

  // ✅ 프리뷰
  previewOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,1)'},
  previewPage: {
    width: SCREEN_W,
    height: SCREEN_H,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {width: SCREEN_W, height: SCREEN_H},
  previewClose: {
    position: 'absolute',
    top: getResponsiveHeight(52),
    right: getResponsiveWidth(18),
    paddingHorizontal: getResponsiveWidth(10),
    paddingVertical: getResponsiveHeight(6),
  },
  previewCloseText: {
    color: '#FFF',
    fontSize: getResponsiveFontSize(14),
    fontWeight: '900',
  },
  previewVideoHint: {
    position: 'absolute',
    bottom: getResponsiveHeight(40),
    paddingHorizontal: getResponsiveWidth(10),
    paddingVertical: getResponsiveHeight(6),
    borderRadius: getResponsiveWidth(999),
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  previewVideoHintText: {
    color: '#FFF',
    fontSize: getResponsiveFontSize(12),
    fontWeight: '800',
  },
});
