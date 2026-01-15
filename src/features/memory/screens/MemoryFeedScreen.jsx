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
} from '../../../utils/responsive';

import SkeletonPhotoGridItem from '../components/SkeletonPhotoGridItem';
import SkeletonMemoryItem from '../components/SkeletonMemoryItem';

import {filterPostsByDateRange} from '../../../utils/postDateFilter';
import {COLORS, EMPTY_STYLE, LAYOUT_STYLE} from '../../../styles/style';

import formatDuration from '../../../utils/formatDuration';
import {getVideoThumbnail} from '../../../utils/videoThumbnail';
import {toCdnUrl} from '../../../utils/mediaUrl';

import {setMemorySelectedTab} from '../store/memorySlice';
import PostFilterBar from '../components/PostFilterBar';
import MagazineBanner from '../components/MagazineBanner';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

/* =========================
 * Constants
 * ========================= */
const ITEM_MARGIN = getResponsiveWidth(2);
const CARD_RADIUS = getResponsiveIconSize(18);

const BG = '#F5F6F8';
const SURFACE = '#FFFFFF';

const fallbackImage = null;

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
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
});

const Bullet = memo(function Bullet() {
  return <View style={styles.bullet} />;
});

/* =========================
 * Main
 * ========================= */
export default function MemoryFeed({
  selectedCategoryTitle,
  startDate,
  endDate,
  onScroll,
  onPressCategoryFilter,
  onPressPeriodFilter,
}) {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  /* -------------------------
   * Redux States
   * ------------------------- */
  const familyId = useSelector(state => state.family?.familyId);

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

  const doFetch = useCallback(() => {
    if (!familyId) return;
    dispatch(fetchMemoryThunk(familyId));
    dispatch(fetchCategoryThunk(familyId));
  }, [dispatch, familyId]);

  /* -------------------------
   * Effects
   * ------------------------- */
  useFocusEffect(
    useCallback(() => {
      doFetch();
    }, [doFetch]),
  );

  const onRefresh = useCallback(() => {
    if (!familyId) return;

    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 350);

    requestAnimationFrame(() => {
      doFetch();
      resetScrollToTop(false);
    });
  }, [doFetch, familyId, resetScrollToTop]);

  const isLoading = memoryLoading && !refreshing;

  const getCategoryLabel = useCallback(
    id => {
      const found = categoryList.find(cat => cat.categoryId === id);
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
              c => c.categoryId === memory.categoryId,
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

    const firstFew = (data || []).slice(0, 24);
    (firstFew || []).forEach(
      it => it?.isVideo && it?.uri && ensureVideoThumbByUri(it.uri),
    );
  }, [isAllPhotos, data, ensureVideoThumbByUri, refreshing]);

  /* =========================
   * Render: Feed Card
   * ========================= */
  const renderListItem = useCallback(
    memory => {
      const {mediaCount, videoCount} = getMediaStats(memory);

      const rawFirstUri = memory?.imageUrls?.[0] || null;
      const firstUri = rawFirstUri ? normalizeMediaUrl(rawFirstUri) : null;

      const firstIsVideo = firstUri ? inferIsVideo(memory, 0, firstUri) : false;
      const firstThumb =
        firstIsVideo && firstUri ? videoThumbMap[firstUri] : null;

      if (!refreshing && firstIsVideo && firstUri && !firstThumb) {
        requestAnimationFrame(() => ensureVideoThumbByUri(firstUri));
      }

      const categoryLabel = getCategoryLabel(memory.categoryId);
      const dateLabel = formatDate(memory.createdAt);

      const mediaLabel =
        videoCount > 0
          ? `미디어 ${mediaCount} · 영상 ${videoCount}`
          : `미디어 ${mediaCount}`;

      const mediaSource = firstIsVideo
        ? firstThumb
          ? {uri: firstThumb}
          : fallbackImage
        : firstUri
        ? {uri: firstUri}
        : fallbackImage;

      const Card = (
        <View style={styles.cardOuter}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() =>
              navigation.navigate('게시글화면', {postId: memory?.postId})
            }
            style={styles.cardPress}>
            <View style={styles.mediaWrap}>
              <FastImage
                style={styles.mediaImg}
                source={mediaSource}
                resizeMode={FastImage.resizeMode.cover}
              />

              {firstIsVideo && (
                <View pointerEvents="none" style={styles.playCenter}>
                  <View style={styles.playCircle}>
                    <View style={styles.playTriangle} />
                  </View>
                </View>
              )}

              <Chip text={categoryLabel} />
            </View>

            <View style={styles.infoArea}>
              <View style={styles.topRow}>
                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>{dateLabel}</Text>
                  <Bullet />
                  <Text style={styles.metaText}>
                    댓글 {memory.commentCount}
                  </Text>
                  <Bullet />
                  <Text style={styles.metaText}>{mediaLabel}</Text>
                </View>
              </View>

              {memory.content ? (
                <Text
                  style={styles.contentText}
                  numberOfLines={2}
                  ellipsizeMode="tail">
                  {memory.content}
                </Text>
              ) : (
                <Text style={styles.contentEmpty} numberOfLines={1}>
                  내용이 없어요
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </View>
      );

      if (refreshing) return Card;

      return (
        <DropShadow
          key={memory.postId}
          style={{
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 3},
            shadowOpacity: 0.08,
            shadowRadius: 3,
          }}>
          {Card}
        </DropShadow>
      );
    },
    [
      ensureVideoThumbByUri,
      formatDate,
      getCategoryLabel,
      getMediaStats,
      inferIsVideo,
      navigation,
      normalizeMediaUrl,
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

      if (!refreshing && isVideo && uri && !thumbUri) {
        requestAnimationFrame(() => ensureVideoThumbByUri(uri));
      }

      const goPost = () => {
        navigation.navigate('게시글화면', {
          postId: item.postId,
          imageIndex: item.indexInPost,
        });
      };

      return (
        <TouchableOpacity
          activeOpacity={0.85}
          key={`${uri}_${index}`}
          onPress={goPost}
          style={{
            width: tileWidth,
            aspectRatio: 1,
            marginBottom: ITEM_MARGIN,
          }}>
          {isVideo ? (
            thumbUri ? (
              <FastImage
                source={{
                  uri: thumbUri,
                  priority: FastImage.priority.normal,
                  cache: FastImage.cacheControl.immutable,
                }}
                style={styles.galleryImage}
                resizeMode={FastImage.resizeMode.cover}
              />
            ) : (
              <FastImage
                source={fallbackImage}
                style={styles.galleryImage}
                resizeMode="cover"
              />
            )
          ) : (
            <FastImage
              source={uri ? {uri} : fallbackImage}
              style={styles.galleryImage}
              resizeMode="cover"
            />
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
    [ensureVideoThumbByUri, navigation, refreshing, tileWidth, videoThumbMap],
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
            showsVerticalScrollIndicator={false}
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
          showsVerticalScrollIndicator={false}
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
    selectedCategoryTitle === '전체'
      ? '전체글'
      : selectedCategoryTitle || '전체글';

  const headerPeriodLabel =
    startDate && endDate
      ? `${startDate.replace(/-/g, '.')} ~ ${endDate.replace(/-/g, '.')}`
      : null;

  const listHeader = (
    <View
      style={{
        paddingHorizontal: LAYOUT_STYLE.screenPaddingHorizontal,
        gap: getResponsiveHeight(4),
        paddingBottom: getResponsiveHeight(8),
      }}>
      <MagazineBanner />
      <PostFilterBar
        categoryTitle={headerCategoryTitle}
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
            showsVerticalScrollIndicator={false}
            keyExtractor={(item, index) => `${item.uri}_${index}`}
            numColumns={gridColumns}
            renderItem={renderMediaItem}
            refreshControl={refreshControl}
            ListHeaderComponent={listHeader}
            columnWrapperStyle={{
              justifyContent: 'flex-start',
              gap: ITEM_MARGIN,
              paddingHorizontal: ITEM_MARGIN,
            }}
            ListEmptyComponent={
              <View style={styles.emptyWrapper}>
                <Text style={styles.emptyText}>
                  아직 등록된 게시글이 없어요
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
            showsVerticalScrollIndicator={false}
            keyExtractor={(item, index) =>
              item.postId?.toString() || `no-id-${index}`
            }
            numColumns={1}
            renderItem={({item}) => renderListItem(item)}
            refreshControl={refreshControl}
            ListHeaderComponent={listHeader}
            // contentContainerStyle={{
            //   paddingTop: getResponsiveHeight(6),
            //   paddingBottom: getResponsiveHeight(28),
            // }}
            ListEmptyComponent={
              <View style={styles.emptyWrapper}>
                <Text style={styles.emptyText}>
                  아직 등록된 게시글이 없어요
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
  /* Layout */
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  /* Card */
  cardOuter: {
    backgroundColor: SURFACE,
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
    marginBottom: getResponsiveHeight(20),
    marginHorizontal: '3%',
  },
  cardPress: {
    width: '100%',
  },

  /* Media */
  mediaWrap: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: '#E5E7EB',
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
    overflow: 'hidden',
    position: 'relative',
  },
  mediaImg: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
  },

  /* Video Icon (Card) */
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

  /* Chip */
  chip: {
    position: 'absolute',
    top: getResponsiveHeight(12),
    right: getResponsiveWidth(12),
    zIndex: 999,
    maxWidth: '92%',

    borderRadius: 999,
    paddingHorizontal: getResponsiveWidth(9),
    paddingVertical: getResponsiveHeight(4),

    backgroundColor: '#F3F4F6',
  },
  chipText: {
    fontSize: getResponsiveFontSize(11.3),
    fontFamily: 'Pretendard-Medium',
    color: '#525252',
    letterSpacing: 0.2,
  },

  /* Info */
  infoArea: {
    backgroundColor: SURFACE,
    paddingHorizontal: getResponsiveWidth(14),
    paddingTop: getResponsiveHeight(12),
    paddingBottom: getResponsiveHeight(14),
  },
  topRow: {
    marginBottom: getResponsiveHeight(8),
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-Medium',
    color: COLORS.textSecondary,
  },
  bullet: {
    width: getResponsiveWidth(3.5),
    height: getResponsiveWidth(3.5),
    borderRadius: 99,
    backgroundColor: '#D1D5DB',
    marginHorizontal: getResponsiveWidth(6),
  },

  contentText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(14.6),
    color: COLORS.textPrimary,
    lineHeight: getResponsiveHeight(20.5),
    letterSpacing: 0.1,
  },
  contentEmpty: {
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(13.5),
    color: COLORS.textPrimary,
  },

  /* Album */
  galleryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    backgroundColor: '#E5E7EB',
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
    color: '#fff',
    fontSize: getResponsiveFontSize(10.5),
    fontWeight: '600',
  },

  /* Empty */
  emptyWrapper: {
    paddingTop: getResponsiveHeight(60),
    alignItems: 'center',
  },
  emptyText: {
    fontSize: EMPTY_STYLE.emptyFontSize,
    fontFamily: EMPTY_STYLE.emptyFontFamily,
    color: EMPTY_STYLE.emptyColor,
  },
});
