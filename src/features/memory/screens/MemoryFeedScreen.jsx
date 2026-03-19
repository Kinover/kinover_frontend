/* eslint-disable react-native/no-inline-styles */
// src/screens/memory/MemoryFeed.jsx

import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
  memo,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  LayoutAnimation,
  UIManager,
  Platform,
  RefreshControl,
  Dimensions,
  Animated,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import DropShadow from 'react-native-drop-shadow';

import {fetchMemoryThunk} from '../store/memoryThunk';
import {fetchCategoryThunk} from '../store/categoryThunk';

import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from 'utils/responsive';

import SkeletonPhotoGridItem from '../components/skeletons/SkeletonPhotoGridItem';
import SkeletonMemoryItem from '../components/skeletons/SkeletonMemoryItem';

import {filterPostsByDateRange} from '../utils/postDateFilter';
import {
  BACKGROUND_COLORS,
  COLORS,
  EMPTY_STYLE,
  LAYOUT_STYLE,
} from 'styles/style';

import formatDuration from 'utils/formatDuration';
import {getVideoThumbnail} from 'utils/videoThumbnail';
import {toCdnUrl} from 'utils/mediaUrl';

import {setMemorySelectedTab} from '../store/memorySlice';
import PostFilterBar from '../components/filters/PostFilterBar';
import MagazineBanner from '../components/sections/MagazineBanner';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

/* =========================
 * Constants
 * ========================= */
const ITEM_MARGIN = getResponsiveWidth(2);

const BG = BACKGROUND_COLORS.secondaryBg;

// FastImage 공통 정책
const FASTIMAGE_DEFAULTS = {
  priority: FastImage.priority.normal,
  cache: FastImage.cacheControl.immutable,
};

const hashStringToHue = (text = '') => {
  const normalized = String(text).trim();
  if (!normalized) return 210;

  let hash = 0;
  for (const char of normalized) {
    hash = char.charCodeAt(0) + ((hash << 5) - hash);
    hash |= 0;
  }
  return Math.abs(hash % 360);
};

// 카테고리 칩: 카테고리별 색상 배경 + 반투명 (이미지 위에서 색이 보이면서 비침)
const getDynamicTagStyle = text => {
  const h = hashStringToHue(text);
  return {
    bg: `hsla(${h}, 42%, 90%, 0.62)`,
    border: `hsla(${h}, 38%, 82%, 0.88)`,
    dot: `hsla(${h}, 56%, 42%, 0.95)`,
    text: `hsla(${h}, 44%, 24%, 1)`,
  };
};

/* =========================
 * Android Layout Animation
 * ========================= */
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* =========================
 * Small Components
 * ========================= */
const Chip = memo(function Chip({text}) {
  if (!text) return null;

  const dynamicStyle = useMemo(() => getDynamicTagStyle(text), [text]);

  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: dynamicStyle.bg,
          borderColor: dynamicStyle.border,
        },
      ]}>
      <View style={[styles.chipDot, {backgroundColor: dynamicStyle.dot}]} />
      <Text
        style={[styles.chipText, {color: dynamicStyle.text}]}
        numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
});

// id/categoryId 혼용 대비 유틸
const getCatId = cat => {
  const v = cat?.categoryId ?? cat?.id ?? null;
  return v != null ? String(v) : null;
};

/* =========================
 * Main
 * ========================= */
export default function MemoryFeed({
  selectedCategoryTitle,
  isCategoryOpen = false,
  startDate,
  endDate,
  onScroll,
  onPressCategoryFilter,
  onPressPeriodFilter,
  filterBarRef,
  firstPostRef,
}) {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  /* -------------------------
   * Redux States
   * ------------------------- */
  const memoryState = useSelector(state => state.memory || {});
  const memoryList = memoryState.memoryList || [];
  const memoryLoading = !!memoryState.loading;

  const categoryList = useSelector(state => state.category?.categoryList || []);

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

  const selectedCategoryId = useMemo(() => {
    if (!selectedCategoryTitle || selectedCategoryTitle === '전체') return null;

    const found = categoryList.find(c => c?.title === selectedCategoryTitle);
    if (!found) return null;

    // 서버/리덕스가 categoryId로 주든 id로 주든 OK
    const id = getCatId(found);
    return id != null ? id : null;
  }, [selectedCategoryTitle, categoryList]);

  const doFetch = useCallback(() => {
    dispatch(fetchCategoryThunk());
    // fetchMemoryThunk가 number를 기대하면 여기서 Number로 변환 필요
    // 일단 안전하게 원본 그대로 넘김(서버 로직에 맞춰)
    dispatch(fetchMemoryThunk(selectedCategoryId));
  }, [dispatch, selectedCategoryId]);

  /* -------------------------
   * Effects
   * ------------------------- */
  useFocusEffect(
    useCallback(() => {
      doFetch();
    }, [doFetch]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 350);

    requestAnimationFrame(() => {
      doFetch();
      resetScrollToTop(false);
    });
  }, [doFetch, resetScrollToTop]);

  const isLoading = memoryLoading && !refreshing;

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
    let list =
      selectedCategoryTitle === '전체'
        ? memoryList
        : memoryList.filter(memory => {
            const cat = categoryList.find(
              c => getCatId(c) === String(memory.categoryId),
            );
            return cat?.title === selectedCategoryTitle;
          });

    list = filterPostsByDateRange(list, startDate, endDate);
    return list;
  }, [memoryList, categoryList, selectedCategoryTitle, startDate, endDate]);

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
        const firstIsVideo = firstUri ? inferIsVideo(memory, 0, firstUri) : false;
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
    selectedCategoryTitle,
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

  /* =========================
   * Render: Feed Card
   * ========================= */
  const renderListItem = useCallback(
    (memory, index) => {
      const {mediaCount} = getMediaStats(memory);

      const rawFirstUri = memory?.imageUrls?.[0] || null;
      const firstUri = rawFirstUri ? normalizeMediaUrl(rawFirstUri) : null;

      const firstIsVideo = firstUri ? inferIsVideo(memory, 0, firstUri) : false;
      const firstThumb =
        firstIsVideo && firstUri ? videoThumbMap[firstUri] : null;

      const categoryLabel = getCategoryLabel(memory.categoryId);
      const dateLabel = formatDate(memory.createdAt);
      const bodyText = String(memory?.content || '').trim();

      const mediaLabel = `댓글 ${
        memory?.commentCount ?? 0
      }  미디어 ${mediaCount}`;

      const mediaSource =
        firstIsVideo && firstThumb
          ? {uri: firstThumb, ...FASTIMAGE_DEFAULTS}
          : !firstIsVideo && firstUri
          ? {uri: firstUri, ...FASTIMAGE_DEFAULTS}
          : null;

      const scaleKey =
        memory?.postId != null ? `post-${memory.postId}` : `idx-${index}`;

      const scale = refreshing ? null : getCardScale(scaleKey);

      const CardInner = (
        <DropShadow style={styles.cardShadowWrap}>
          <View
            ref={index === 0 ? firstPostRef : undefined}
            collapsable={index === 0 ? false : undefined}
            style={styles.cardOuter}>
            <TouchableOpacity
            activeOpacity={1}
            onPressIn={() => pressInCard(scaleKey)}
            onPressOut={() => pressOutCard(scaleKey)}
            onPress={() =>
              navigation.navigate('게시글화면', {postId: memory?.postId})
            }
            style={styles.cardPress}>
            <View style={styles.cardHeader}>
              <Text style={styles.dateText}>
                {dateLabel}
              </Text>
              <Text style={styles.metaCompactText}>
                {mediaLabel}
              </Text>
            </View>

            <View style={styles.mediaWrap}>
              {mediaSource ? (
                <FastImage
                  fallback={true}
                  style={styles.mediaImg}
                  source={mediaSource}
                  resizeMode={FastImage.resizeMode.cover}
                />
              ) : (
                <View style={styles.mediaPlaceholder} />
              )}

              {firstIsVideo && (
                <View pointerEvents="none" style={styles.playCenter}>
                  <View style={styles.playCircle}>
                    <View style={styles.playTriangle} />
                  </View>
                </View>
              )}

              <Chip text={categoryLabel} />

            </View>

            <View style={styles.contentArea}>
              {bodyText ? (
                <Text style={styles.contentText} numberOfLines={3} ellipsizeMode="tail">
                  {bodyText}
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>
          </View>
        </DropShadow>
      );

      if (refreshing || !scale) return CardInner;

      return (
        <Animated.View
          key={memory.postId ?? `shadow-${index}`}
          style={{transform: [{scale}]}}>
          {CardInner}
        </Animated.View>
      );
    },
    [
      ensureVideoThumbByUri,
      formatDate,
      getCardScale,
      getCategoryLabel,
      getMediaStats,
      inferIsVideo,
      navigation,
      normalizeMediaUrl,
      pressInCard,
      pressOutCard,
      refreshing,
      videoThumbMap,
    ],
  );

  /* =========================
   * Render: Album Tile
   * ========================= */
  const renderMediaItem = useCallback(
    ({item, index}) => {
      const uri = item?.uri;
      const isVideo = !!item?.isVideo;
      const thumbUri = isVideo && uri ? videoThumbMap[uri] : null;

      const goPost = () => {
        navigation.navigate('게시글화면', {
          postId: item.postId,
          imageIndex: item.indexInPost,
        });
      };

      const source =
        isVideo && thumbUri
          ? {uri: thumbUri, ...FASTIMAGE_DEFAULTS}
          : !isVideo && uri
          ? {uri, ...FASTIMAGE_DEFAULTS}
          : null;

      return (
        <TouchableOpacity
          activeOpacity={0.85}
          key={`${uri || 'no-uri'}_${index}`}
          onPress={goPost}
          style={{
            width: tileWidth,
            aspectRatio: 1,
            marginBottom: ITEM_MARGIN,
          }}>
          {source ? (
            <FastImage
              fallback={true}
              source={source}
              style={styles.galleryImage}
              resizeMode={FastImage.resizeMode.cover}
            />
          ) : (
            <View style={styles.galleryPlaceholder} />
          )}

          {isVideo && (
            <>
              <View pointerEvents="none" style={styles.albumPlayOverlay}>
                <View style={styles.albumPlayCircle}>
                  <View style={styles.albumPlayTriangle} />
                </View>
              </View>

              {!!item?.duration && (
                <View pointerEvents="none" style={styles.videoBadge}>
                  <Text style={styles.videoBadgeText}>
                    {formatDuration(item.duration)}
                  </Text>
                </View>
              )}
            </>
          )}
        </TouchableOpacity>
      );
    },
    [navigation, tileWidth, videoThumbMap],
  );

  const renderFeedItem = useCallback(
    ({item, index}) => renderListItem(item, index),
    [renderListItem],
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
   * Header UI (FilterBar)
   * ========================= */
  const refreshControl = (
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
  );

  const headerCategoryTitle =
    selectedCategoryTitle === '전체' ? '전체' : selectedCategoryTitle || '전체';

  const headerPeriodLabel =
    startDate && endDate
      ? `${startDate.replace(/-/g, '.')} ~ ${endDate.replace(/-/g, '.')}`
      : null;

  const listHeader = (
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
    </View>
  );

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
            keyExtractor={(item, index) => `${item.uri}_${index}`}
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
            ListEmptyComponent={
              <View style={styles.emptyWrapper}>
                <Text style={styles.emptyText}>
                  아직 등록된 게시글이 없어요.
                </Text>
              </View>
            }
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
            keyExtractor={(item, index) =>
              item.postId?.toString() || `no-id-${index}`
            }
            numColumns={1}
            renderItem={renderFeedItem}
            refreshControl={refreshControl}
            ListHeaderComponent={listHeader}
            initialNumToRender={8}
            maxToRenderPerBatch={6}
            windowSize={7}
            removeClippedSubviews={true}
            ListEmptyComponent={
              <View style={styles.emptyWrapper}>
                <Text style={styles.emptyText}>
                  아직 등록된 게시글이 없어요.
                </Text>
              </View>
            }
          />
        </GestureDetector>
      )}
    </View>
  );
}

/* =========================
 * Styles
 * ========================= */
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: BG},
  postContainer: {},

  cardShadowWrap: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  cardOuter: {
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: getResponsiveIconSize(12),
    overflow: 'visible',
    marginBottom: getResponsiveHeight(18),
    marginHorizontal: '3%',
    paddingHorizontal: getResponsiveWidth(22),
    paddingVertical: getResponsiveHeight(27),
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  cardPress: {width: '100%'},

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: getResponsiveHeight(7),
  },
  metaCompactText: {
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-Regular',
    lineHeight: getResponsiveFontSize(15),
    textAlignVertical: 'bottom',
    color: COLORS.textDefault,
    marginLeft: getResponsiveWidth(8),
  },
  dateText: {
    fontSize: getResponsiveFontSize(15),
    fontFamily: 'Pretendard-Regular',
    lineHeight: getResponsiveFontSize(18),
    textAlignVertical: 'bottom',
    color: COLORS.textPrimary,
    letterSpacing: 0.2,
  },
  mediaWrap: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: COLORS.borderSubtle,
    borderRadius: getResponsiveIconSize(2),
    overflow: 'hidden',
    position: 'relative',
  },
  mediaImg: {width: '100%', height: '100%', backgroundColor: COLORS.surfaceMuted},
  mediaPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.surfaceMuted,
  },

  playCenter: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playCircle: {
    width: getResponsiveWidth(54),
    height: getResponsiveWidth(54),
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 20,
    borderTopWidth: 12,
    borderBottomWidth: 12,
    borderLeftColor: 'rgba(255,255,255,0.95)',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 3,
  },

  chip: {
    position: 'absolute',
    top: getResponsiveHeight(10),
    right: getResponsiveWidth(10),
    zIndex: 3,
    maxWidth: getResponsiveWidth(128),
    minHeight: getResponsiveHeight(22),
    borderRadius: 999,
    paddingHorizontal: getResponsiveWidth(9),
    paddingVertical: getResponsiveHeight(3.5),
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  chipDot: {
    width: getResponsiveWidth(5),
    height: getResponsiveWidth(5),
    borderRadius: 99,
    marginRight: getResponsiveWidth(4.5),
  },
  chipText: {
    fontSize: getResponsiveFontSize(10.8),
    fontFamily: 'Pretendard-SemiBold',
    letterSpacing: 0.1,
    flexShrink: 1,
  },

  contentArea: {
    paddingHorizontal: 0,
    paddingTop: getResponsiveHeight(14),
  },

  contentText: {
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(14),
    color: COLORS.textPrimary,
    lineHeight: getResponsiveHeight(19),
    letterSpacing: 0.1,
  },
  contentEmpty: {
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(13.5),
    color: COLORS.textPrimary,
  },

  galleryImage: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.borderSubtle,
  },
  galleryPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.borderSubtle,
  },

  albumPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumPlayCircle: {
    width: getResponsiveWidth(36),
    height: getResponsiveWidth(36),
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumPlayTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderTopWidth: 9,
    borderBottomWidth: 9,
    borderLeftColor: 'rgba(255,255,255,0.95)',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 3,
  },

  videoBadge: {
    position: 'absolute',
    bottom: getResponsiveWidth(4),
    right: getResponsiveWidth(4),
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 7,
  },
  videoBadgeText: {
    color: COLORS.textInverse,
    fontSize: getResponsiveFontSize(10.5),
  },

  emptyWrapper: {paddingTop: getResponsiveHeight(60), alignItems: 'center'},
  emptyText: {
    fontSize: EMPTY_STYLE().emptyFontSize,
    fontFamily: EMPTY_STYLE().emptyFontFamily,
    color: EMPTY_STYLE().emptyColor,
  },
});
