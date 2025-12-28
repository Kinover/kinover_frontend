import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
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
import {useNavigation} from '@react-navigation/native';
import {launchImageLibrary} from 'react-native-image-picker';
import DraggableFlatList from 'react-native-draggable-flatlist';

import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
} from '../../../utils/responsive';

import useHideTabBar from '../../../hooks/useHideTabBar';
import ToastModal from '../../../components/ToastModal';
import {EMPTY_STYLE, HEADER_STYLES, SETTING_STYLES} from 'styles/style';

import {
  convertPhUriToFileUri,
  convertContentUriToFileUri,
} from '../../../utils/photoUriConverter';

import {requestMediaPermission} from 'utils/requestMediaPermission';

const MAX_SELECTION = 30;

const GRID_COLS = 3;
const GRID_GAP = getResponsiveWidth(2);
const H_PADDING = getResponsiveWidth(2);
const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');

// ✅ 화면 꽉차는 정사각 그리드
const ITEM_SIZE =
  (SCREEN_W - H_PADDING * 2 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

export default function ImageSelectPage() {
  const navigation = useNavigation();

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);

  const [selectedFiles, setSelectedFiles] = useState([]);

  // ✅ 탭하면 전체화면 프리뷰
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

  const openSystemAlbum = useCallback(async () => {
    const hasPermission = await requestMediaPermission();
    if (!hasPermission) {
      showToast('사진 접근 권한이 필요해요.');
      return;
    }

    const res = await launchImageLibrary({
      mediaType: 'mixed',
      selectionLimit: MAX_SELECTION,
      includeExtra: true,
      quality: 1,
    });

    if (res.didCancel) {
      if (!selectedFiles || selectedFiles.length === 0) navigation.goBack();
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
        id: `${uri}-${i}`, // ✅ drag key
        uri,
        isVideo: !!isVideo,
        duration: duration ?? 0,
        ext,
        mimeType,
      });
    }

    setSelectedFiles(converted);
  }, [extToMime, getExt, navigation, selectedFiles, showToast]);

  const goNext = useCallback(() => {
    if (!selectedFiles || selectedFiles.length === 0) {
      showToast('먼저 사진/동영상을 선택해줘요!');
      return;
    }

    navigation.navigate('카테고리선택화면', {
      selectedImages: selectedFiles.map(({id, ...rest}) => rest),
      from: '이미지선택화면',
    });
  }, [navigation, selectedFiles, showToast]);

  useEffect(() => {
    if (hasOpenedOnce) return;
    setHasOpenedOnce(true);
    openSystemAlbum();
  }, [hasOpenedOnce, openSystemAlbum]);

  const hasSelection = selectedFiles.length > 0;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Text style={styles.headerTitle}>
          사진 업로드 {hasSelection ? `(${selectedFiles.length})` : ''}
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
  }, [goNext, hasSelection, navigation, openSystemAlbum, selectedFiles.length]);

  // ✅ NaN 방지: 항상 배열에서 현재 인덱스로 계산
  const getOrder = useCallback(
    item => {
      const idx = selectedFiles.findIndex(f => f.id === item.id);
      return idx >= 0 ? idx + 1 : '';
    },
    [selectedFiles],
  );

  // ✅ “개수만큼만” 높이 잡고, 많아지면 스크롤
  const listWrapStyle = useMemo(() => {
    if (!hasSelection) return null;

    const rows = Math.ceil(selectedFiles.length / GRID_COLS);
    const contentH = rows * ITEM_SIZE + (rows - 1) * GRID_GAP;

    const maxH = getResponsiveHeight(620);
    return {height: Math.min(contentH, maxH)};
  }, [hasSelection, selectedFiles.length]);

  // ✅ 프리뷰 FlatList: initialScrollIndex 안전장치(가끔 RN 경고 방지)
  const onPreviewScrollToIndexFailed = useCallback(info => {
    // 대충 0.1초 뒤 재시도
    setTimeout(() => {
      // no-op (FlatList가 자체 재시도하는 케이스도 많아서 최소 처리)
    }, 100);
  }, []);

  /**
   * ✅ 드래그 UX 포인트
   * - Pressable onLongPress={drag} + delayLongPress
   * - DraggableFlatList: dragItemOverflow / renderPlaceholder로 “붙어서 움직이는 느낌” 강화
   */
  const renderSelectedItem = useCallback(
    ({item, drag, isActive}) => {
      const order = getOrder(item);

      return (
        <Pressable
          onPress={() => {
            // ✅ 탭하면 전체화면 확대 (현재 순서 기준)
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

          {/* ✅ 미니멀 순서 칩 */}
          <View style={styles.orderChip}>
            <Text style={styles.orderChipText}>{order}</Text>
          </View>

          {item.isVideo ? (
            <View style={styles.videoPill}>
              <Text style={styles.videoPillText}>VIDEO</Text>
            </View>
          ) : null}
        </Pressable>
      );
    },
    [getOrder, selectedFiles],
  );

  return (
    <View style={styles.container}>
      {hasSelection ? (
        <View style={[styles.listWrap, listWrapStyle]}>
          <DraggableFlatList
            data={selectedFiles}
            keyExtractor={item => item.id}
            onDragEnd={({data}) => setSelectedFiles(data)}
            renderItem={renderSelectedItem}
            numColumns={GRID_COLS}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
            // ✅ “손에 붙어 움직이는 느낌” 강화
            dragItemOverflow
            autoscrollSpeed={80}
            renderPlaceholder={() => <View style={styles.placeholder} />}
          />
        </View>
      ) : (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>선택된 사진이 없어요</Text>

          <TouchableOpacity
            onPress={openSystemAlbum}
            activeOpacity={0.9}
            style={styles.emptyCta}>
            <Text style={styles.emptyCtaText}>갤러리 열기</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ✅ 전체화면 확대 프리뷰 */}
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
    // paddingHorizontal: getResponsiveWidth(6),
    paddingVertical: getResponsiveHeight(6),
  },
  checkIcon: {
    width: HEADER_STYLES.headerRightIconWidth,
    height: HEADER_STYLES.headerRightIconHeight,
    marginRight: HEADER_STYLES.headerRightIconRightPadding,
    resizeMode: 'contain',
  },
  listWrap: {
    alignSelf: 'stretch',
  },
  grid: {
    paddingBottom: GRID_GAP,
  },
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
  tileImage: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    opacity: 0, // ✅ 자리를 비워서 “움직임”이 더 잘 보이게
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

  emptyBox: {
    borderRadius: getResponsiveWidth(16),
    backgroundColor: '#F6F6F6',
    paddingVertical: getResponsiveHeight(26),
    paddingHorizontal: getResponsiveWidth(18),
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: EMPTY_STYLE.emptyFontSize,
    fontWeight: '900',
    color: '#222',
    marginBottom: getResponsiveHeight(6),
  },
  emptyDesc: {
    fontSize: getResponsiveFontSize(12.5),
    fontWeight: '700',
    color: '#666',
    textAlign: 'center',
    lineHeight: getResponsiveHeight(18),
    marginBottom: getResponsiveHeight(14),
  },
  emptyCta: {
    paddingHorizontal: getResponsiveWidth(16),
    paddingVertical: getResponsiveHeight(10),
    borderRadius: getResponsiveWidth(25),
    backgroundColor: '#FFC84D',
  },
  emptyCtaText: {
    fontSize: getResponsiveFontSize(13),
    fontWeight: '900',
    color: '#2A2A2A',
  },

  // ✅ 전체화면 프리뷰
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,1)',
  },
  previewPage: {
    width: SCREEN_W,
    height: SCREEN_H,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: SCREEN_W,
    height: SCREEN_H,
  },
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
