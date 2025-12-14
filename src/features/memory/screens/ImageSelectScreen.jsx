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
  Linking,
  PanResponder,
  LayoutAnimation,
  UIManager,
  AppState,
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

// ✅ iOS 사진 권한(모든 사진) 유도용
import {
  check,
  request,
  openSettings,
  PERMISSIONS,
  RESULTS,
} from 'react-native-permissions';

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

  // ✅ iOS “모든 사진”이 아니면 화면 막기
  const [mustAllowAll, setMustAllowAll] = useState(false);

  const showToast = useCallback(msg => {
    setToastMessage(msg);
    setToastVisible(true);
  }, []);

  const hideToast = useCallback(() => {
    setToastVisible(false);
  }, []);

  // ✅ iOS: "모든 사진" 권한인지 체크 (limited면 막기)
  const ensureFullPhotoAccessIOS = useCallback(async () => {
    if (Platform.OS !== 'ios') return true;

    const status = await check(PERMISSIONS.IOS.PHOTO_LIBRARY);

    // ✅ 전체 허용
    if (status === RESULTS.GRANTED) {
      setMustAllowAll(false);
      return true;
    }

    // ✅ limited(선택한 사진만) → 반드시 설정으로 유도
    if (status === RESULTS.LIMITED) {
      setMustAllowAll(true);
      return false;
    }

    // ✅ 아직 미요청/거절 → 요청 시도
    if (status === RESULTS.DENIED) {
      const req = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);

      if (req === RESULTS.GRANTED) {
        setMustAllowAll(false);
        return true;
      }
      if (req === RESULTS.LIMITED) {
        setMustAllowAll(true);
        return false;
      }

      // denied/blocked
      setMustAllowAll(true);
      return false;
    }

    // blocked / unavailable 등
    setMustAllowAll(true);
    return false;
  }, []);

  const loadPhotos = async (after = null) => {
    const {
      photos: newPhotos,
      endCursor: newCursor,
      hasNextPage: newHasNext,
    } = await loadGalleryPhotos(after, PAGE_SIZE);

    if (after) {
      setPhotos(prev => [...prev, ...newPhotos]);
    } else {
      setPhotos(newPhotos);
    }
    setEndCursor(newCursor);
    setHasNextPage(newHasNext);
  };

  // ✅ 처음 진입 시: 권한 확인 후 로딩
  useEffect(() => {
    const init = async () => {
      const ok = await ensureFullPhotoAccessIOS();
      if (!ok) return;
      loadPhotos();
    };
    init();
  }, [ensureFullPhotoAccessIOS]);

  // ✅ 설정 앱 갔다가 돌아오면 자동 재체크 → ok면 로딩
  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    const sub = AppState.addEventListener('change', async state => {
      if (state !== 'active') return;

      const ok = await ensureFullPhotoAccessIOS();
      if (ok && photos.length === 0) {
        // 처음에 막혀서 로딩 못 했던 케이스
        loadPhotos();
      }
    });

    return () => sub.remove();
  }, [ensureFullPhotoAccessIOS, photos.length]);

  const handleEndReached = async () => {
    if (mustAllowAll) return; // ✅ 막혀있으면 페이징도 금지
    if (isLoadingMore || !hasNextPage || !endCursor) return;
    setIsLoadingMore(true);
    await loadPhotos(endCursor);
    setIsLoadingMore(false);
  };

  const onRefresh = async () => {
    if (mustAllowAll) return; // ✅ 막혀있으면 리프레시 금지
    setIsRefreshing(true);
    await loadPhotos(null);
    setIsRefreshing(false);
  };

  // 🔹 그리드 한 칸의 실제 크기 (컬럼 수에 따라 자동 변경)
  const IMAGE_SIZE = React.useMemo(() => {
    const totalMargin = IMAGE_MARGIN * (gridColumns * 2);
    return (SCREEN_WIDTH - totalMargin) / gridColumns;
  }, [gridColumns]);

  // ✅ 탭으로 선택/해제할 때 30장 제한 적용
  const toggleSelect = item => {
    setSelected(prev => {
      const exists = prev.some(f => f.uri === item.uri);

      if (exists) return prev.filter(f => f.uri !== item.uri);

      if (prev.length >= MAX_SELECTION) {
        showToast(`사진은 최대 ${MAX_SELECTION}장까지 선택할 수 있어요.`);
        return prev;
      }

      return [...prev, item];
    });
  };

  const handleNext = useCallback(async () => {
    if (selected.length === 0) {
      showToast('최소 1장 이상 선택해 주세요.');
      return;
    }

    const convertedUris = [];
    for (let i = 0; i < selected.length; i++) {
      const file = selected[i];
      let uri = file.uri;

      if (Platform.OS === 'ios' && uri.startsWith('ph://')) {
        const converted = await convertPhUriToFileUri(uri, i, file.isVideo);
        if (converted) convertedUris.push(converted);
      } else if (Platform.OS === 'android' && uri.startsWith('content://')) {
        const converted = await convertContentUriToFileUri(
          uri,
          i,
          file.isVideo,
        );
        if (converted) convertedUris.push(converted);
      } else {
        convertedUris.push(uri);
      }
    }

    navigation.navigate('카테고리선택화면', {
      selectedImages: convertedUris,
      from: '이미지선택화면',
    });
  }, [selected, navigation, showToast]);

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
          disabled={disabled || mustAllowAll} // ✅ 막혀있으면 다음도 막기
          style={[
            {marginRight: getResponsiveWidth(10)},
            (disabled || mustAllowAll) && {opacity: 0.4},
          ]}>
          <Image
            source={require('../../../assets/icons/check.png')}
            style={styles.checkIcon}
          />
        </TouchableOpacity>
      ),
    });
  }, [selected, navigation, handleNext, mustAllowAll]);

  // 🔹 드래그 모드에 따라 선택/해제 업데이트 (여기에도 30장 제한)
  const updateSelectionByMode = useCallback((item, mode) => {
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
  }, []);

  // 1) 먼저 얘부터
  const handleDragAtLocation = useCallback(
    (x, y, isStart = false) => {
      if (mustAllowAll) return; // ✅ 막혀있으면 드래그도 막기
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
      mustAllowAll,
      photos,
      scrollOffset,
      gridColumns,
      selected,
      dragMode,
      IMAGE_SIZE,
      updateSelectionByMode,
    ],
  );

  // 2) 그 다음에 safe wrapper
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
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        if (mustAllowAll) return false;
        const {dx, dy} = gestureState;
        return Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy);
      },
      onPanResponderGrant: evt => {
        if (mustAllowAll) return;
        const {locationX, locationY} = evt.nativeEvent;
        safeHandleDragAtLocation(locationX, locationY, true);
      },
      onPanResponderMove: evt => {
        if (mustAllowAll) return;
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
      <TouchableOpacity
        onPress={() => toggleSelect(item)}
        activeOpacity={0.8}
        disabled={mustAllowAll} // ✅ 막혀있으면 선택도 막기
      >
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

      {/* ✅ iOS: “모든 사진” 아니면 강제 오버레이 */}
      {Platform.OS === 'ios' && mustAllowAll && (
        <View style={styles.blockOverlay}>
          <Text style={styles.blockTitle}>사진 권한이 필요해요</Text>
          <Text style={styles.blockDesc}>
            키노버는 업로드를 위해 “모든 사진” 접근이 필요해요.{'\n'}
            설정에서 사진 접근을 “모든 사진”으로 바꿔주세요.
          </Text>

          <TouchableOpacity
            style={styles.blockBtn}
            onPress={() => openSettings()}>
            <Text style={styles.blockBtnText}>설정 열기</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.blockSubBtn}
            onPress={() => Linking.openURL('app-settings:')}>
            <Text style={styles.blockSubBtnText}>안 열리면 여기 눌러줘요</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ✅ 토스트 모달 */}
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
  permissionHint: {
    position: 'absolute',
    bottom: getResponsiveHeight(50),
    left: getResponsiveWidth(10),
    right: getResponsiveWidth(10),
    backgroundColor: '#00000088',
    paddingVertical: getResponsiveHeight(8),
    paddingHorizontal: getResponsiveWidth(10),
    borderRadius: 8,
  },
  permissionHintText: {
    color: 'white',
    textAlign: 'center',
    fontSize: getResponsiveFontSize(12),
    lineHeight: getResponsiveHeight(16),
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

  // ✅ iOS 권한 강제 오버레이
  blockOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getResponsiveWidth(24),
  },
  blockTitle: {
    color: 'white',
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'Pretendard-SemiBold',
    marginBottom: getResponsiveHeight(10),
  },
  blockDesc: {
    color: 'white',
    fontSize: getResponsiveFontSize(12.5),
    textAlign: 'center',
    lineHeight: getResponsiveHeight(18),
    marginBottom: getResponsiveHeight(16),
  },
  blockBtn: {
    backgroundColor: '#FFC84D',
    paddingVertical: getResponsiveHeight(12),
    paddingHorizontal: getResponsiveWidth(20),
    borderRadius: 10,
  },
  blockBtnText: {
    color: '#111',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(13),
  },
  blockSubBtn: {
    marginTop: getResponsiveHeight(10),
    paddingVertical: getResponsiveHeight(6),
    paddingHorizontal: getResponsiveWidth(10),
  },
  blockSubBtnText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(11.5),
    textDecorationLine: 'underline',
  },
});
