/* eslint-disable react-native/no-inline-styles */
// src/screens/memory/MemoryFeed.jsx

import React, {useCallback, useMemo, useRef, useState, useEffect} from 'react';
import {
  View,
  FlatList,
  LayoutAnimation,
  UIManager,
  Platform,
  RefreshControl,
  Dimensions,
  Animated,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';

import {useGetCategoriesQuery, useGetPostsQuery} from '../services/memoryApi';

import {
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveWidth,
} from 'utils/responsive';

import SkeletonPhotoGridItem from '../components/skeletons/SkeletonPhotoGridItem';
import SkeletonMemoryItem from '../components/skeletons/SkeletonMemoryItem';

import {filterPostsByDateRange} from '../utils/postDateFilter';
import AppText from 'components/AppText';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {BACKGROUND_COLORS, EMPTY_STYLE, LAYOUT_STYLE} from 'styles/style';

import {getVideoThumbnail} from 'utils/videoThumbnail';
import {toCdnUrl} from 'utils/mediaUrl';

import {setMemorySelectedTab} from '../store/memorySlice';
import PostFilterBar from '../components/filters/PostFilterBar';
import MagazineBanner from '../components/sections/MagazineBanner';
import MemoryFeedListItem from '../components/items/MemoryFeedListItem';
import AlbumMediaTile from '../components/items/AlbumMediaTile';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

/* =========================
 * Constants
 * ========================= */
const ITEM_MARGIN = getResponsiveWidth(2);

const BG = BACKGROUND_COLORS.secondaryBg;

/* =========================
 * Android Layout Animation
 * ========================= */
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// id/categoryId 혼용 대비 유틸
const getCatId = cat => {
  const v = cat?.categoryId ?? cat?.id ?? null;
  return v != null ? String(v) : null;
};

/** 앨범 FlatList: 정렬이 바뀌어도 셀 정체성이 유지되도록 postId + 슬롯 인덱스 기준 */
function albumMediaItemKey(item) {
  const pid = item?.postId;
  const slot = item?.indexInPost;
  if (pid != null && slot != null) {
    return `${String(pid)}-${slot}`;
  }
  return item?.uri ? String(item.uri) : 'album-unknown';
}

function feedPostKey(item, index) {
  return item.postId?.toString() || `no-id-${index}`;
}

/* =========================
 * Main
 * ========================= */
const isUuidString = v =>
  typeof v === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

export default function MemoryFeed({
  selectedCategoryTitle,
  /** null | string[] — null이면 전체 */
  selectedCategoryIds = null,
  isCategoryOpen = false,
  startDate,
  endDate,
  onScroll,
  onPressCategoryFilter,
  onPressPeriodFilter,
  filterBarRef,
  firstPostRef,
}) {
  const styles = useScaledStyleSheet(_rf => ({
    container: {flex: 1, backgroundColor: BG},
    postContainer: {},

    emptyWrapper: {paddingTop: getResponsiveHeight(60), alignItems: 'center'},
    emptyIcon: {
      fontSize: getResponsiveFontSize(38),
      marginBottom: getResponsiveHeight(8),
    },
    emptyText: {
      fontSize: EMPTY_STYLE().emptyFontSize,
      fontFamily: EMPTY_STYLE().emptyFontFamily,
      color: EMPTY_STYLE().emptyColor,
    },
    emptySubText: {
      marginTop: getResponsiveHeight(4),
      fontSize: getResponsiveFontSize(11),
      fontFamily: 'Pretendard-Regular',
      color: EMPTY_STYLE().emptyColor,
    },

    gestureHintRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      paddingVertical: getResponsiveHeight(6),
    },
    gestureHintText: {
      fontSize: getResponsiveFontSize(11),
      fontFamily: 'Pretendard-Regular',
      color: EMPTY_STYLE().emptyColor,
    },
  }));
  const dispatch = useDispatch();
  const navigation = useNavigation();

  /* -------------------------
   * Redux States
   * ------------------------- */
  const memoryState = useSelector(state => state.memory || {});
  const memoryLoading = !!memoryState.loading;
  const fallbackMemoryList = memoryState.memoryList || [];

  const fallbackCategoryList = useSelector(state => state.category?.categoryList || []);

  const selectedTab = useSelector(
    state => state.memory?.ui?.selectedTab ?? 'feed',
  );

  /* -------------------------
   * Local States
   * ------------------------- */
  const [gridColumns, setGridColumns] = useState(4);
  const [videoThumbMap, setVideoThumbMap] = useState({});
  const thumbLoadingRef = useRef(new Set());

  const [refreshing, setRefreshing] = useState(false);
  const [sortKey, setSortKey] = useState('latest');

  const listRef = useRef(null);

  // 카드 scale 애니메이션 값 저장소
  const cardScaleMapRef = useRef(new Map());

  const getCardScale = useCallback(scaleKey => {
    const key = scaleKey != null ? String(scaleKey) : null;
    if (!key) return null;

    const map = cardScaleMapRef.current;
    if (!map.has(key)) map.set(key, new Animated.Value(1));
    return map.get(key);
  }, []);

  const pressInCard = useCallback(
    scaleKey => {
      const scale = getCardScale(scaleKey);
      if (!scale) return;

      Animated.spring(scale, {
        toValue: 0.97,
        useNativeDriver: true,
        speed: 150,
        bounciness: 0,
      }).start();
    },
    [getCardScale],
  );

  const pressOutCard = useCallback(
    scaleKey => {
      const scale = getCardScale(scaleKey);
      if (!scale) return;

      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 28,
        bounciness: 6,
      }).start();
    },
    [getCardScale],
  );

  /* -------------------------
   * Helpers
   * ------------------------- */
  const onChangeTab = useCallback(
    tab => dispatch(setMemorySelectedTab(tab)),
    [dispatch],
  );

  const emitScrollZeroToParent = useCallback(() => {
    if (!onScroll) return;
    const fakeEvent = {nativeEvent: {contentOffset: {y: 0}}};
    try {
      onScroll(fakeEvent);
    } catch (e) {
      null;
    }
  }, [onScroll]);

  const resetScrollToTop = useCallback(
    (animated = false) => {
      listRef.current?.scrollToOffset?.({offset: 0, animated});
      requestAnimationFrame(() => emitScrollZeroToParent());
    },
    [emitScrollZeroToParent],
  );

  const normalizeMediaUrl = useCallback(uri => {
    const u = toCdnUrl(uri);
    return u || null;
  }, []);

  const ensureVideoThumbByUri = useCallback(
    async rawUri => {
      if (refreshing) return;

      const uri = normalizeMediaUrl(rawUri);
      if (!uri) return;

      try {
        if (videoThumbMap[uri]) return;
        if (thumbLoadingRef.current.has(uri)) return;

        thumbLoadingRef.current.add(uri);

        const t = await getVideoThumbnail(uri);
        const thumbUri = t?.uri || null;

        if (thumbUri) setVideoThumbMap(prev => ({...prev, [uri]: thumbUri}));
      } catch (e) {
        console.log('❌ ensureVideoThumbByUri failed:', uri, e?.message || e);
      } finally {
        thumbLoadingRef.current.delete(uri);
      }
    },
    [normalizeMediaUrl, videoThumbMap, refreshing],
  );

  /** API: UUID 하나일 때만 서버에 categoryId 전달, 복수면 전체 조회 후 클라이언트 필터 */
  const selectedCategoryId = useMemo(() => {
    if (selectedCategoryIds == null || selectedCategoryIds.length === 0) {
      return null;
    }
    if (selectedCategoryIds.length === 1) {
      const id = String(selectedCategoryIds[0]);
      return isUuidString(id) ? id : null;
    }
    return null;
  }, [selectedCategoryIds]);

  const {
    data: categoryQueryData,
    refetch: refetchCategories,
  } = useGetCategoriesQuery();
  const {
    data: postsQueryData,
    isFetching: isPostsFetching,
    refetch: refetchPosts,
  } = useGetPostsQuery({categoryId: selectedCategoryId || undefined});
  const categoryList = Array.isArray(categoryQueryData)
    ? categoryQueryData
    : fallbackCategoryList;
  const memoryList = Array.isArray(postsQueryData)
    ? postsQueryData
    : fallbackMemoryList;

  const doFetch = useCallback(async () => {
    await Promise.allSettled([
      refetchCategories(),
      refetchPosts(),
    ]);
  }, [refetchCategories, refetchPosts]);

  /* -------------------------
   * Effects
   * ------------------------- */
  useFocusEffect(
    useCallback(() => {
      doFetch();
    }, [doFetch]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await doFetch();
    } finally {
      setRefreshing(false);
      resetScrollToTop(false);
    }
  }, [doFetch, resetScrollToTop]);

  const isLoading = (isPostsFetching || memoryLoading) && !refreshing;

  const getCategoryLabel = useCallback(
    id => {
      const found = categoryList.find(cat => getCatId(cat) === String(id));
      return found ? found.title : '카테고리 없음';
    },
    [categoryList],
  );

  const formatDate = useCallback(dateStr => {
    const date = new Date(dateStr);
    const y = date.getFullYear();
    const m = `${date.getMonth() + 1}`.padStart(2, '0');
    const d = `${date.getDate()}`.padStart(2, '0');
    return `${y}.${m}.${d}`;
  }, []);

  const inferIsVideo = useCallback((memory, index, uri) => {
    const type = memory?.postTypes?.[index];
    if (type) return String(type).toLowerCase() === 'video';

    const ext = String(uri || '')
      .split('?')[0]
      .split('.')
      .pop()
      ?.toLowerCase();

    return ext === 'mp4' || ext === 'mov';
  }, []);

  const getMediaStats = useCallback(
    memory => {
      const rawUrls = Array.isArray(memory?.imageUrls) ? memory.imageUrls : [];
      const normalized = rawUrls.map(u => normalizeMediaUrl(u)).filter(Boolean);

      const mediaCount = normalized.length;
      if (mediaCount === 0) {
        return {mediaCount: 0, videoCount: 0, imageCount: 0};
      }

      let videoCount = 0;
      for (let i = 0; i < normalized.length; i++) {
        if (inferIsVideo(memory, i, normalized[i])) videoCount += 1;
      }

      const imageCount = Math.max(mediaCount - videoCount, 0);
      return {mediaCount, videoCount, imageCount};
    },
    [inferIsVideo, normalizeMediaUrl],
  );

  /* -------------------------
   * Filtering / Sorting
   * ------------------------- */
  const filteredMemoryList = useMemo(() => {
    let list = memoryList;
    if (selectedCategoryIds != null && selectedCategoryIds.length > 0) {
      const idSet = new Set(selectedCategoryIds.map(String));
      list = memoryList.filter(m => idSet.has(String(m.categoryId)));
    }
    list = filterPostsByDateRange(list, startDate, endDate);
    return list;
  }, [memoryList, selectedCategoryIds, startDate, endDate]);

  const sortedMemoryList = useMemo(() => {
    const list = [...filteredMemoryList];

    list.sort((a, b) => {
      const at = new Date(a?.createdAt).getTime();
      const bt = new Date(b?.createdAt).getTime();
      return sortKey === 'latest' ? bt - at : at - bt;
    });

    return list;
  }, [filteredMemoryList, sortKey]);

  const allMedia = useMemo(() => {
    const postsSorted = [...filteredMemoryList].sort((a, b) => {
      const at = new Date(a?.createdAt).getTime();
      const bt = new Date(b?.createdAt).getTime();
      return sortKey === 'latest' ? bt - at : at - bt;
    });

    return postsSorted.flatMap(memory => {
      const urls = memory?.imageUrls || [];
      return urls
        .map((rawUri, idx) => {
          const uri = normalizeMediaUrl(rawUri);
          if (!uri) return null;

          return {
            uri,
            indexInPost: idx,
            isVideo: inferIsVideo(memory, idx, uri),
            duration: memory?.durations?.[idx] ?? 0,
            postId: memory?.postId,
            memory,
          };
        })
        .filter(Boolean);
    });
  }, [filteredMemoryList, sortKey, inferIsVideo, normalizeMediaUrl]);

  const feedPreviewVideoUris = useMemo(() => {
    return (sortedMemoryList || [])
      .slice(0, 16)
      .map(memory => {
        const rawFirstUri = memory?.imageUrls?.[0] || null;
        const firstUri = rawFirstUri ? normalizeMediaUrl(rawFirstUri) : null;
        const firstIsVideo = firstUri
          ? inferIsVideo(memory, 0, firstUri)
          : false;
        return firstIsVideo && firstUri ? firstUri : null;
      })
      .filter(Boolean);
  }, [sortedMemoryList, normalizeMediaUrl, inferIsVideo]);

  const albumPreviewVideoUris = useMemo(() => {
    return (allMedia || [])
      .filter(item => item?.isVideo && item?.uri)
      .slice(0, 36)
      .map(item => item.uri);
  }, [allMedia]);

  const isAllPhotos = selectedTab === 'album';
  const data = isAllPhotos ? allMedia : sortedMemoryList;

  /* -------------------------
   * Tile Size
   * ------------------------- */
  const tileWidth = useMemo(() => {
    const columns = gridColumns;
    const totalMargin = ITEM_MARGIN * (columns + 1);
    return (SCREEN_WIDTH - totalMargin) / columns;
  }, [gridColumns]);

  useEffect(() => {
    if (refreshing) return;
    resetScrollToTop(false);
  }, [
    selectedCategoryIds,
    startDate,
    endDate,
    selectedTab,
    sortKey,
    refreshing,
    resetScrollToTop,
  ]);

  /* -------------------------
   * Gestures
   * ------------------------- */
  const pinch = Gesture.Pinch()
    .runOnJS(true)
    .onEnd(event => {
      if (refreshing) return;

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

  const tabSwipe = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-24, 24])
    .failOffsetY([-18, 18])
    .onEnd(e => {
      if (refreshing) return;

      const dx = e.translationX;
      const dy = e.translationY;
      const vx = e.velocityX;

      if (Math.abs(dx) < Math.abs(dy) * 1.2) return;

      const passed = Math.abs(dx) > 80 || Math.abs(vx) > 1100;
      if (!passed) return;

      if (isAllPhotos) {
        if (dx > 0) onChangeTab('feed');
      } else {
        if (dx < 0) onChangeTab('album');
      }
    });

  const albumGesture = useMemo(
    () => Gesture.Simultaneous(pinch, tabSwipe),
    [pinch, tabSwipe],
  );

  useEffect(() => {
    if (!isAllPhotos) return;
    if (refreshing) return;

    albumPreviewVideoUris.forEach(uri => ensureVideoThumbByUri(uri));
  }, [isAllPhotos, albumPreviewVideoUris, ensureVideoThumbByUri, refreshing]);

  useEffect(() => {
    if (isAllPhotos) return;
    if (refreshing) return;

    feedPreviewVideoUris.forEach(uri => ensureVideoThumbByUri(uri));
  }, [isAllPhotos, feedPreviewVideoUris, ensureVideoThumbByUri, refreshing]);

  const onPressPost = useCallback(
    postId => {
      if (postId == null) return;
      navigation.navigate('게시글화면', {postId});
    },
    [navigation],
  );

  const openAlbumPost = useCallback(
    (postId, imageIndex) => {
      if (postId == null) return;
      navigation.navigate('게시글화면', {postId, imageIndex});
    },
    [navigation],
  );

  /* =========================
   * Render: Feed / Album rows (memoized children)
   * ========================= */
  const renderFeedItem = useCallback(
    ({item: memory, index}) => {
      const {mediaCount} = getMediaStats(memory);
      const rawFirstUri = memory?.imageUrls?.[0] || null;
      const firstUri = rawFirstUri ? normalizeMediaUrl(rawFirstUri) : null;
      const firstIsVideo = firstUri ? inferIsVideo(memory, 0, firstUri) : false;
      const firstThumb =
        firstIsVideo && firstUri ? videoThumbMap[firstUri] : null;

      const scaleKey =
        memory?.postId != null ? `post-${memory.postId}` : `idx-${index}`;

      return (
        <MemoryFeedListItem
          postId={memory?.postId}
          index={index}
          scaleKey={scaleKey}
          refreshing={refreshing}
          scale={refreshing ? null : getCardScale(scaleKey)}
          dateLabel={formatDate(memory.createdAt)}
          mediaLabel={`댓글 ${memory?.commentCount ?? 0}  미디어 ${mediaCount}`}
          bodyText={String(memory?.content || '').trim()}
          categoryLabel={getCategoryLabel(memory.categoryId)}
          firstUri={firstUri}
          firstIsVideo={firstIsVideo}
          firstThumbUri={firstThumb}
          onPressPost={onPressPost}
          onPressInCard={pressInCard}
          onPressOutCard={pressOutCard}
          firstPostRef={firstPostRef}
        />
      );
    },
    [
      formatDate,
      getCardScale,
      getCategoryLabel,
      getMediaStats,
      inferIsVideo,
      normalizeMediaUrl,
      pressInCard,
      pressOutCard,
      refreshing,
      videoThumbMap,
      onPressPost,
      firstPostRef,
    ],
  );

  const renderMediaItem = useCallback(
    ({item}) => (
      <AlbumMediaTile
        uri={item?.uri}
        isVideo={!!item?.isVideo}
        thumbUri={item?.isVideo && item?.uri ? videoThumbMap[item.uri] : null}
        duration={item?.duration}
        tileWidth={tileWidth}
        postId={item?.postId}
        indexInPost={item?.indexInPost}
        onOpenPost={openAlbumPost}
      />
    ),
    [tileWidth, videoThumbMap, openAlbumPost],
  );

  const refreshControl = useMemo(
    () => <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />,
    [refreshing, onRefresh],
  );

  const headerCategoryTitle =
    selectedCategoryTitle === '전체' ? '전체' : selectedCategoryTitle || '전체';

  const headerPeriodLabel =
    startDate && endDate
      ? `${startDate.replace(/-/g, '.')} ~ ${endDate.replace(/-/g, '.')}`
      : null;

  const listHeader = useMemo(
    () => (
      <View
        style={{
          paddingHorizontal: LAYOUT_STYLE().screenPaddingHorizontal,
          gap: getResponsiveHeight(4),
          paddingBottom: getResponsiveHeight(8),
        }}>
        <MagazineBanner />
        <PostFilterBar
          ref={filterBarRef}
          categoryTitle={headerCategoryTitle}
          categoryOpen={isCategoryOpen}
          onPressCategory={onPressCategoryFilter}
          periodLabel={headerPeriodLabel}
          onPressDateFilter={onPressPeriodFilter}
          sortKey={sortKey}
          onChangeSort={setSortKey}
        />
        {isAllPhotos && (
          <View style={styles.gestureHintRow}>
            <AppText style={styles.gestureHintText}>
              핀치로 크기 조절 · 좌우 스와이프로 탭 전환
            </AppText>
          </View>
        )}
      </View>
    ),
    [
      headerCategoryTitle,
      isCategoryOpen,
      onPressCategoryFilter,
      headerPeriodLabel,
      onPressPeriodFilter,
      sortKey,
      isAllPhotos,
      styles,
    ],
  );

  const listEmptyComponent = useMemo(
    () => (
      <View style={styles.emptyWrapper}>
        <AppText style={styles.emptyIcon}>📷</AppText>
        <AppText style={styles.emptyText}>아직 게시글이 없어요.</AppText>
        <AppText style={styles.emptySubText}>
          소중한 순간을 기록해보세요.
        </AppText>
      </View>
    ),
    [styles],
  );

  /* =========================
   * Loading UI (Skeleton)
   * ========================= */
  if (isLoading) {
    if (isAllPhotos) {
      const skeletonData = Array.from({length: 12}, (_, i) => i.toString());
      const columns = 4;
      const totalMargin = ITEM_MARGIN * (columns + 1);
      const w = (SCREEN_WIDTH - totalMargin) / columns;

      return (
        <View style={styles.container}>
          <FlatList
            data={skeletonData}
            numColumns={columns}
            keyExtractor={item => item}
            renderItem={() => (
              <View
                style={{
                  width: w,
                  aspectRatio: 1,
                  marginBottom: ITEM_MARGIN,
                }}>
                <SkeletonPhotoGridItem />
              </View>
            )}
            columnWrapperStyle={{
              justifyContent: 'flex-start',
              gap: ITEM_MARGIN,
              paddingHorizontal: ITEM_MARGIN,
            }}
            contentContainerStyle={{
              paddingTop: ITEM_MARGIN,
              paddingBottom: getResponsiveHeight(24),
            }}
            showsVerticalScrollIndicator={true}
          />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <FlatList
          data={Array.from({length: 5}, (_, i) => i.toString())}
          keyExtractor={item => item}
          renderItem={() => <SkeletonMemoryItem />}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{
            paddingTop: ITEM_MARGIN,
            paddingBottom: getResponsiveHeight(24),
          }}
        />
      </View>
    );
  }

  /* =========================
   * Render
   * ========================= */
  return (
    <View style={[styles.container, !isAllPhotos && styles.postContainer]}>
      {isAllPhotos ? (
        <GestureDetector gesture={albumGesture}>
          <FlatList
            ref={listRef}
            key={`album-${gridColumns}`}
            data={data}
            onScroll={onScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={true}
            keyExtractor={albumMediaItemKey}
            numColumns={gridColumns}
            renderItem={renderMediaItem}
            refreshControl={refreshControl}
            ListHeaderComponent={listHeader}
            initialNumToRender={12}
            maxToRenderPerBatch={8}
            windowSize={7}
            removeClippedSubviews={true}
            columnWrapperStyle={{
              justifyContent: 'flex-start',
              gap: ITEM_MARGIN,
              paddingHorizontal: ITEM_MARGIN,
            }}
            ListEmptyComponent={listEmptyComponent}
          />
        </GestureDetector>
      ) : (
        <GestureDetector gesture={tabSwipe}>
          <FlatList
            ref={listRef}
            key="feed"
            data={data}
            onScroll={onScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={true}
            keyExtractor={feedPostKey}
            numColumns={1}
            renderItem={renderFeedItem}
            refreshControl={refreshControl}
            ListHeaderComponent={listHeader}
            initialNumToRender={8}
            maxToRenderPerBatch={6}
            windowSize={7}
            removeClippedSubviews={true}
            ListEmptyComponent={listEmptyComponent}
          />
        </GestureDetector>
      )}
    </View>
  );
}
