import React, {
  useEffect,
  useState,
  useLayoutEffect,
  useCallback,
  useRef,
} from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Text,
  Platform,
  Image,
  Dimensions,
  PanResponder,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
} from '../../../utils/responsive';
import useHideTabBar from '../../../hooks/useHideTabBar';

import {
  convertPhUriToFileUri,
  convertContentUriToFileUri,
} from '../../../utils/photoUriConverter';
import {getSelectOrder} from '../../../utils/selection';
import {loadGalleryPhotos} from '../../../utils/gallery';
import formatDuration from '../../../utils/formatDuration';
import {HEADER_STYLES} from 'styles/style';
import ToastModal from '../../../components/ToastModal';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';

// ====== 이미지 그리드 설정 ======
const SCREEN_WIDTH = Dimensions.get('window').width;
const IMAGE_MARGIN = getResponsiveWidth(2);

// 페이지당 불러올 이미지 개수
const PAGE_SIZE = 60;

// ✅ 선택 가능한 최대 개수
const MAX_SELECTION = 30;

// 🔹 Android에서 LayoutAnimation 활성화
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ImageSelectPage() {
  const [photos, setPhotos] = useState([]);
  const [selected, setSelected] = useState([]);

  const [endCursor, setEndCursor] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [scrollOffset, setScrollOffset] = useState(0);

  // 🔹 그리드 컬럼 수 (핀치로 2~4 사이 변경)
  const [gridColumns, setGridColumns] = useState(3);

  // 드래그 선택용 상태
  const [dragMode, setDragMode] = useState(null); // 'add' | 'remove' | null
  const lastIndexRef = useRef(null);

  const navigation = useNavigation();

  // ✅ 토스트 상태
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = useCallback(msg => {
    setToastMessage(msg);
    setToastVisible(true);
  }, []);

  const hideToast = useCallback(() => {
    setToastVisible(false);
  }, []);

  const loadPhotosPage = useCallback(async (after = null) => {
    const res = await loadGalleryPhotos(after, PAGE_SIZE);

    const newPhotos = res?.photos ?? [];
    const newCursor = res?.endCursor ?? null;
    const newHasNext = !!res?.hasNextPage;

    if (after) setPhotos(prev => [...prev, ...newPhotos]);
    else setPhotos(newPhotos);

    setEndCursor(newCursor);
    setHasNextPage(newHasNext);
  }, []);

  // ✅ 처음 진입 시 로딩
  useEffect(() => {
    loadPhotosPage(null);
  }, [loadPhotosPage]);

  const handleEndReached = useCallback(async () => {
    if (isLoadingMore || !hasNextPage || !endCursor) return;
    setIsLoadingMore(true);
    await loadPhotosPage(endCursor);
    setIsLoadingMore(false);
  }, [isLoadingMore, hasNextPage, endCursor, loadPhotosPage]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadPhotosPage(null);
    setIsRefreshing(false);
  }, [loadPhotosPage]);

  // 🔹 그리드 한 칸의 실제 크기 (컬럼 수에 따라 자동 변경)
  const IMAGE_SIZE = React.useMemo(() => {
    const totalMargin = IMAGE_MARGIN * (gridColumns * 2);
    return (SCREEN_WIDTH - totalMargin) / gridColumns;
  }, [gridColumns]);

  // ✅ uri에서 확장자 추정 (변환 후 file:// 경로면 잘 잡힘)
  const getExtFromUri = useCallback(uri => {
    try {
      const clean = (uri || '').split('?')[0];
      const ext = clean.split('.').pop()?.toLowerCase();
      if (!ext || ext.includes('/') || ext.length > 6) return null;
      return ext;
    } catch {
      return null;
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

  // ✅ 탭으로 선택/해제할 때 30장 제한 적용
  const toggleSelect = useCallback(
    item => {
      setSelected(prev => {
        const exists = prev.some(f => f.uri === item.uri);

        if (exists) return prev.filter(f => f.uri !== item.uri);

        if (prev.length >= MAX_SELECTION) {
          showToast(`사진은 최대 ${MAX_SELECTION}장까지 선택할 수 있어요.`);
          return prev;
        }

        return [...prev, item];
      });
    },
    [showToast],
  );

  const handleNext = useCallback(async () => {
    if (selected.length === 0) {
      showToast('최소 1장 이상 선택해 주세요.');
      return;
    }

    // ✅ 다음 화면(CreatePost)에서 영상/이미지 판단 가능하도록
    //    { uri, isVideo, duration, ext, mimeType } 형태로 넘김
    const convertedFiles = [];

    for (let i = 0; i < selected.length; i++) {
      const file = selected[i];
      let uri = file.uri;

      if (Platform.OS === 'ios' && uri.startsWith('ph://')) {
        const converted = await convertPhUriToFileUri(uri, i, file.isVideo);
        if (converted) uri = converted;
      } else if (Platform.OS === 'android' && uri.startsWith('content://')) {
        const converted = await convertContentUriToFileUri(
          uri,
          i,
          file.isVideo,
        );
        if (converted) uri = converted;
      }

      const ext = getExtFromUri(uri) || (file.isVideo ? 'mp4' : 'jpg');
      const mimeType = extToMime(ext);

      convertedFiles.push({
        uri,
        isVideo: !!file.isVideo,
        duration: file.duration ?? 0,
        ext,
        mimeType,
      });
    }

    navigation.navigate('카테고리선택화면', {
      selectedImages: convertedFiles, // ✅ 이제 string[] 아님!
      from: '이미지선택화면',
    });
  }, [selected, navigation, showToast, getExtFromUri, extToMime]);

  useHideTabBar();

  useLayoutEffect(() => {
    const disabled = selected.length === 0;

    navigation.setOptions({
      headerTitle: () => (
        <Text style={styles.headerTitle}>사진 업로드 ({selected.length})</Text>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={handleNext}
          disabled={disabled}
          style={[
            {marginRight: getResponsiveWidth(10)},
            disabled && {opacity: 0.4},
          ]}>
          <Image
            source={require('../../../assets/icons/check.png')}
            style={styles.checkIcon}
          />
        </TouchableOpacity>
      ),
    });
  }, [selected, navigation, handleNext]);

  // 🔹 드래그 모드에 따라 선택/해제 업데이트 (여기에도 30장 제한)
  const updateSelectionByMode = useCallback(
    (item, mode) => {
      if (!item) return;

      setSelected(prev => {
        const exists = prev.some(f => f.uri === item.uri);

        if (mode === 'add') {
          if (exists) return prev;
          if (prev.length >= MAX_SELECTION) return prev;
          return [...prev, item];
        }

        if (mode === 'remove') {
          if (!exists) return prev;
          return prev.filter(f => f.uri !== item.uri);
        }

        return prev;
      });
    },
    [setSelected],
  );

  const handleDragAtLocation = useCallback(
    (x, y, isStart = false) => {
      if (!photos || photos.length === 0) return;

      const tileFullSize = IMAGE_SIZE + IMAGE_MARGIN * 2;

      const col = Math.floor(x / tileFullSize);
      if (col < 0 || col >= gridColumns) return;

      const row = Math.floor((scrollOffset + y) / tileFullSize);
      if (row < 0) return;

      const index = row * gridColumns + col;
      if (index < 0 || index >= photos.length) return;

      if (lastIndexRef.current === index && !isStart) return;

      const item = photos[index];

      if (isStart) {
        const alreadySelected = selected.some(f => f.uri === item.uri);
        const mode = alreadySelected ? 'remove' : 'add';
        setDragMode(mode);
        updateSelectionByMode(item, mode);
      } else {
        if (!dragMode) return;
        updateSelectionByMode(item, dragMode);
      }

      lastIndexRef.current = index;
    },
    [
      photos,
      scrollOffset,
      gridColumns,
      selected,
      dragMode,
      IMAGE_SIZE,
      updateSelectionByMode,
    ],
  );

  const safeHandleDragAtLocation = useCallback(
    (x, y, isStart = false) => {
      requestAnimationFrame(() => {
        handleDragAtLocation(x, y, isStart);
      });
    },
    [handleDragAtLocation],
  );

  // 🔹 PanResponder: 가로로 손가락 끌면 드래그 선택 (세로 스크롤은 FlatList가 담당)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const {dx, dy} = gestureState;
        return Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy);
      },
      onPanResponderGrant: evt => {
        const {locationX, locationY} = evt.nativeEvent;
        safeHandleDragAtLocation(locationX, locationY, true);
      },
      onPanResponderMove: evt => {
        const {locationX, locationY} = evt.nativeEvent;
        safeHandleDragAtLocation(locationX, locationY, false);
      },
      onPanResponderRelease: () => {
        setDragMode(null);
        lastIndexRef.current = null;
      },
      onPanResponderTerminate: () => {
        setDragMode(null);
        lastIndexRef.current = null;
      },
    }),
  ).current;

  // 🔹 Pinch 제스처: 2~4 컬럼 변경 + LayoutAnimation
  const pinch = Gesture.Pinch().onEnd(event => {
    const scale = event.scale;

    setGridColumns(prev => {
      let next = prev;

      if (scale > 1.07 && prev > 2) next = prev - 1;
      else if (scale < 0.93 && prev < 4) next = prev + 1;

      if (next !== prev) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }
      return next;
    });
  });

  const renderItem = ({item}) => {
    const isSelected = selected.some(f => f.uri === item.uri);
    const order = getSelectOrder(selected, item.uri);

    return (
      <TouchableOpacity onPress={() => toggleSelect(item)} activeOpacity={0.8}>
        <View
          style={[
            styles.imageWrapper,
            {width: IMAGE_SIZE, height: IMAGE_SIZE},
            isSelected && styles.selectedImage,
          ]}>
          <Image source={{uri: item.uri}} style={styles.image} />

          {item.isVideo && (
            <View style={styles.videoBadge}>
              <Text style={styles.videoBadgeText}>
                {formatDuration(item.duration)}
              </Text>
            </View>
          )}

          {isSelected && (
            <>
              <View style={styles.tileSelectedOverlay} />
              <View style={styles.orderBadge}>
                <Text style={styles.orderBadgeText}>{order}</Text>
              </View>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <GestureDetector gesture={pinch}>
        <FlatList
          data={photos}
          key={`select-${gridColumns}`} // 🔹 컬럼 바뀔 때 리렌더
          keyExtractor={(item, index) => item.uri + index}
          renderItem={renderItem}
          numColumns={gridColumns}
          contentContainerStyle={styles.galleryContainer}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.2}
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          onScroll={e => setScrollOffset(e.nativeEvent.contentOffset?.y ?? 0)}
          scrollEventThrottle={16}
          ListFooterComponent={
            isLoadingMore ? <Text style={styles.footer} /> : null
          }
        />
      </GestureDetector>

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
    backgroundColor: 'white',
    borderTopWidth: 2,
    borderColor: '#E5E5E5',
    paddingTop: getResponsiveHeight(2),
  },
  headerTitle: {
    fontSize: HEADER_STYLES.defaultTitleFontSize,
    fontFamily: HEADER_STYLES.defaultTitleFontFamily,
    color: HEADER_STYLES.defaultTitleFontColor,
    lineHeight: getResponsiveHeight(26),
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  checkIcon: {
    width: HEADER_STYLES.headerRightIconWidth,
    height: HEADER_STYLES.headerRightIconHeight,
    marginRight: HEADER_STYLES.headerRightIconRightPadding,
    resizeMode: 'contain',
  },
  galleryContainer: {},
  imageWrapper: {
    position: 'relative',
    margin: IMAGE_MARGIN,
    backgroundColor: 'rgba(128, 128, 128, 0.6)',
  },
  tileSelectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    backgroundColor: 'rgba(128, 128, 128, 0.6)',
  },
  selectedImage: {
    borderWidth: 2,
    borderColor: '#FFC84D',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  orderBadge: {
    position: 'absolute',
    top: getResponsiveWidth(4),
    right: getResponsiveWidth(4),
    width: getResponsiveWidth(20),
    height: getResponsiveWidth(20),
    borderRadius: getResponsiveWidth(10),
    borderColor: '#FFC84D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
    backgroundColor: '#fff',
    zIndex: 2,
  },
  orderBadgeText: {
    color: '#FFC84D',
    fontSize: getResponsiveFontSize(11),
    fontWeight: '700',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  footer: {
    textAlign: 'center',
    paddingVertical: getResponsiveHeight(10),
    color: '#666',
  },
  videoBadge: {
    position: 'absolute',
    bottom: getResponsiveWidth(4),
    right: getResponsiveWidth(4),
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 2,
  },
  videoBadgeText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(10.5),
    fontWeight: '600',
  },
});
