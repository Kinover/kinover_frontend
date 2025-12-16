/* eslint-disable react-native/no-inline-styles */
import React, {useCallback, useMemo, useRef, useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  LayoutAnimation,
  UIManager,
  Platform,
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
import {WINDOW_WIDTH} from '@gorhom/bottom-sheet';
import SkeletonPhotoGridItem from '../components/SkeletonPhotoGridItem';
import SkeletonMemoryItem from '../components/SkeletonMemoryItem';
import {filterPostsByDateRange} from 'utils/postDateFilter';
import {EMPTY_STYLE} from 'styles/style';
import formatDuration from '../../../utils/formatDuration';
import {getVideoThumbnail} from '../../../utils/videoThumbnail';

// ✅ CDN 정규화
import {toCdnUrl} from '../../../utils/mediaUrl';

const ITEM_MARGIN = getResponsiveWidth(2);
const fallbackImage = require('../../../assets/images/default.png');
const AVATAR_RADIUS = getResponsiveWidth(8);
const CARD_RADIUS = getResponsiveIconSize(10);

// 🔹 Android에서 LayoutAnimation 활성화
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function MemoryFeed({
  selectedCategoryTitle,
  selectedTab,
  startDate,
  onScroll, // ✅ 추가

  endDate,
}) {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const familyId = useSelector(state => state.family.familyId);
  const {memoryList = [], loading: memoryLoading} = useSelector(
    state => state.memory,
  );
  const categoryList = useSelector(state => state.category.categoryList || []);

  // 🔹 앨범 그리드 컬럼 개수 (핀치로 2~4 사이 변경)
  const [gridColumns, setGridColumns] = useState(4);

  // ✅ video thumbnail cache (videoUrl -> thumbUri)
  const [videoThumbMap, setVideoThumbMap] = useState({});
  const thumbLoadingRef = useRef(new Set());

  // ✅ 여기서 "항상 같은 규칙으로" URL 정규화
  const normalizeMediaUrl = useCallback(uri => {
    const u = toCdnUrl(uri);
    return u || null;
  }, []);

  const ensureVideoThumbByUri = useCallback(
    async rawUri => {
      const uri = normalizeMediaUrl(rawUri);
      if (!uri) return;

      try {
        // 이미 있거나 로딩 중이면 스킵
        if (videoThumbMap[uri]) return;
        if (thumbLoadingRef.current.has(uri)) return;

        thumbLoadingRef.current.add(uri);

        const t = await getVideoThumbnail(uri);
        const thumbUri = t?.uri || null;

        if (thumbUri) {
          setVideoThumbMap(prev => ({...prev, [uri]: thumbUri}));
        }
      } catch (e) {
        console.log('❌ ensureVideoThumbByUri failed:', uri, e?.message || e);
      } finally {
        thumbLoadingRef.current.delete(uri);
      }
    },
    [normalizeMediaUrl, videoThumbMap],
  );

  // 🚀 데이터 로딩
  useFocusEffect(
    useCallback(() => {
      if (!familyId) return;
      dispatch(fetchMemoryThunk(familyId));
      dispatch(fetchCategoryThunk(familyId));
    }, [dispatch, familyId]),
  );

  const isLoading = memoryLoading;

  const getCategoryLabel = id => {
    const found = categoryList.find(cat => cat.categoryId === id);
    return found ? found.title : '카테고리 없음';
  };

  const formatDate = dateStr => {
    const date = new Date(dateStr);
    const y = date.getFullYear();
    const m = `${date.getMonth() + 1}`.padStart(2, '0');
    const d = `${date.getDate()}`.padStart(2, '0');
    return `${y}.${m}.${d}`;
  };

  // ✅ postTypes 지원 (없으면 확장자로 추정)
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

  // ✅ 카드/앨범 공통 "미디어 카운트" 계산 (postTypes 없을 때도 일관되게)
  const getMediaStats = useCallback(
    memory => {
      const rawUrls = Array.isArray(memory?.imageUrls) ? memory.imageUrls : [];
      const normalized = rawUrls.map(u => normalizeMediaUrl(u)).filter(Boolean);

      const mediaCount = normalized.length;
      if (mediaCount === 0)
        return {mediaCount: 0, videoCount: 0, imageCount: 0};

      let videoCount = 0;
      for (let i = 0; i < normalized.length; i++) {
        if (inferIsVideo(memory, i, normalized[i])) videoCount += 1;
      }
      const imageCount = Math.max(mediaCount - videoCount, 0);
      return {mediaCount, videoCount, imageCount};
    },
    [inferIsVideo, normalizeMediaUrl],
  );

  // 🔹 날짜/카테고리 필터 적용된 게시글 리스트
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

  // 🔹 앨범 탭에서 사용할 전체 "미디어" 리스트 (이미지+영상)
  const allMedia = useMemo(() => {
    return filteredMemoryList.flatMap(memory => {
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
  }, [filteredMemoryList, inferIsVideo, normalizeMediaUrl]);

  const isAllPhotos = selectedTab === 'album';
  const data = isAllPhotos ? allMedia : filteredMemoryList;

  // 🔹 그리드 한 칸의 너비
  const tileWidth = useMemo(() => {
    const columns = gridColumns;
    const totalMargin = ITEM_MARGIN * (columns + 1);
    return (WINDOW_WIDTH - totalMargin) / columns;
  }, [gridColumns]);

  // 🔹 Pinch Gesture: 2~4 컬럼 변경 + LayoutAnimation
  const pinch = Gesture.Pinch()
    .runOnJS(true)
    .onEnd(event => {
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

  // ✅ 앨범 탭: 처음 몇 개 썸네일 미리 뽑기
  useEffect(() => {
    if (!isAllPhotos) return;
    const firstFew = (data || []).slice(0, 24);
    (async () => {
      for (const it of firstFew) {
        if (it?.isVideo && it?.uri) await ensureVideoThumbByUri(it.uri);
      }
    })();
  }, [isAllPhotos, data, ensureVideoThumbByUri]);

  // ====== 게시글 카드 렌더러 ======
  const renderListItem = memory => {
    const {mediaCount} = getMediaStats(memory);

    // ✅ 첫 미디어 URL 정규화
    const rawFirstUri = memory?.imageUrls?.[0] || null;
    const firstUri = rawFirstUri ? normalizeMediaUrl(rawFirstUri) : null;

    const firstIsVideo = firstUri ? inferIsVideo(memory, 0, firstUri) : false;
    const firstThumb =
      firstIsVideo && firstUri ? videoThumbMap[firstUri] : null;

    if (firstIsVideo && firstUri && !firstThumb) {
      requestAnimationFrame(() => ensureVideoThumbByUri(firstUri));
    }

    return (
      <DropShadow
        key={memory.postId}
        style={{
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 0},
          shadowOpacity: 0.12,
          shadowRadius: 10,
        }}>
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: CARD_RADIUS,
            marginVertical: getResponsiveHeight(8),
            paddingVertical: getResponsiveHeight(3),
            width: '100%',
          }}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('게시글화면', {memory})}
            style={styles.memoryItem}>
            <View style={styles.topRow}>
              <Text style={styles.dateText}>
                {formatDate(memory.createdAt)}
              </Text>

              <View style={styles.badgeRow}>
                <View style={styles.commentBadge}>
                  <Text style={styles.badgeText}>
                    댓글 {memory.commentCount}
                  </Text>
                </View>

                {/* ✅ 사진/영상 합쳐서 "미디어"로 통일 */}
                <View style={styles.imageCountBadge}>
                  <Text style={styles.badgeText}>미디어 {mediaCount}</Text>
                </View>
              </View>
            </View>

            {firstUri ? (
              firstIsVideo ? (
                <View style={styles.previewWrap}>
                  {firstThumb ? (
                    <FastImage
                      style={styles.memoryImage}
                      source={{
                        uri: firstThumb,
                        priority: FastImage.priority.normal,
                        cache: FastImage.cacheControl.immutable,
                      }}
                      resizeMode={FastImage.resizeMode.cover}
                      onError={e =>
                        console.log(
                          '❌ MemoryFeed firstThumb error:',
                          firstThumb,
                          e?.nativeEvent,
                        )
                      }
                    />
                  ) : (
                    <FastImage
                      style={styles.memoryImage}
                      source={fallbackImage}
                      resizeMode={FastImage.resizeMode.cover}
                    />
                  )}

                  <View pointerEvents="none" style={styles.playOverlay}>
                    <View style={styles.playTriangle} />
                  </View>
                </View>
              ) : (
                <FastImage
                  style={styles.memoryImage}
                  source={{uri: firstUri}}
                  resizeMode={FastImage.resizeMode.cover}
                  onError={e =>
                    console.log(
                      '❌ MemoryFeed firstImage error:',
                      firstUri,
                      e?.nativeEvent,
                    )
                  }
                />
              )
            ) : (
              <FastImage style={styles.memoryImage} source={fallbackImage} />
            )}

            <Text
              style={{
                fontSize: getResponsiveFontSize(17),
                marginBottom: getResponsiveHeight(4),
                marginTop: getResponsiveHeight(3),
                fontFamily: 'Pretendard-Medium',
                color: 'black',
              }}>
              {getCategoryLabel(memory.categoryId)}
            </Text>

            {!!memory.content && (
              <Text
                style={styles.contentText}
                numberOfLines={2}
                ellipsizeMode="tail">
                {memory.content}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </DropShadow>
    );
  };

  // ====== 앨범 그리드 렌더러 (이미지+영상) ======
  const renderMediaItem = ({item, index}) => {
    const uri = item?.uri; // ✅ 이미 정규화된 URL
    const isVideo = !!item?.isVideo;
    const thumbUri = isVideo && uri ? videoThumbMap[uri] : null;

    if (isVideo && uri && !thumbUri) {
      requestAnimationFrame(() => ensureVideoThumbByUri(uri));
    }

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        key={`${uri}_${index}`}
        onPress={() =>
          navigation.navigate('게시글화면', {
            memory: item.memory,
            imageIndex: item.indexInPost,
          })
        }
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
              onError={e =>
                console.log(
                  '❌ MemoryFeed album thumb error:',
                  thumbUri,
                  e?.nativeEvent,
                )
              }
            />
          ) : (
            <FastImage
              source={fallbackImage}
              style={styles.galleryImage}
              resizeMode={FastImage.resizeMode.cover}
            />
          )
        ) : (
          <FastImage
            source={uri ? {uri} : fallbackImage}
            style={styles.galleryImage}
            resizeMode={FastImage.resizeMode.cover}
            onError={e =>
              console.log(
                '❌ MemoryFeed album image error:',
                uri,
                e?.nativeEvent,
              )
            }
          />
        )}

        {isVideo && (
          <>
            <View pointerEvents="none" style={styles.albumPlayOverlay}>
              <View style={styles.albumPlayTriangle} />
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
  };

  // ====== 로딩 스켈레톤 ======
  if (isLoading) {
    if (isAllPhotos) {
      const skeletonData = Array.from({length: 12}, (_, i) => i.toString());

      return (
        <View style={styles.container}>
          <FlatList
            data={skeletonData}
            numColumns={4}
            keyExtractor={item => item}
            renderItem={() => (
              <View
                style={{
                  width: (WINDOW_WIDTH - ITEM_MARGIN * 3) / 4,
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

  // ====== 실제 렌더 ======
  return (
    <View style={[styles.container, !isAllPhotos && styles.postContainer]}>
      {isAllPhotos ? (
        <GestureDetector gesture={pinch}>
          <FlatList
            key={`album-${gridColumns}`}
            data={data}
            onScroll={onScroll} // ✅ 여기 연결
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item, index) => `${item.uri}_${index}`}
            numColumns={gridColumns}
            renderItem={renderMediaItem}
            columnWrapperStyle={{
              justifyContent: 'flex-start',
              gap: ITEM_MARGIN,
              paddingHorizontal: ITEM_MARGIN,
            }}
            contentContainerStyle={{
              paddingTop: ITEM_MARGIN,
              paddingBottom: getResponsiveHeight(24),
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
        <FlatList
          key="post"
          data={data}
          onScroll={onScroll} // ✅ 여기 연결
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item, index) =>
            item.postId?.toString() || `no-id-${index}`
          }
          numColumns={1}
          renderItem={({item}) => renderListItem(item)}
          contentContainerStyle={{
            paddingTop: ITEM_MARGIN,
            paddingBottom: getResponsiveHeight(24),
          }}
          ListEmptyComponent={
            <View style={styles.emptyWrapper}>
              <Text style={styles.emptyText}>아직 등록된 게시글이 없어요</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F3F4F6'},
  postContainer: {paddingHorizontal: '3%'},

  memoryItem: {
    width: '100%',
    paddingHorizontal: getResponsiveWidth(16),
    paddingVertical: getResponsiveHeight(14),
    backgroundColor: '#FFFFFF',
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveHeight(8),
  },
  dateText: {
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-Regular',
    color: '#9CA3AF',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    gap: getResponsiveWidth(6),
  },
  commentBadge: {
    paddingHorizontal: getResponsiveWidth(8),
    paddingVertical: getResponsiveHeight(3),
    borderRadius: 999,
    backgroundColor: '#F3F4FF',
  },
  imageCountBadge: {
    paddingHorizontal: getResponsiveWidth(8),
    paddingVertical: getResponsiveHeight(3),
    borderRadius: 999,
    backgroundColor: '#F3F4FF',
  },
  badgeText: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-Medium',
    color: '#4B5563',
  },

  previewWrap: {
    width: '100%',
    alignSelf: 'center',
    aspectRatio: 4 / 3,
    borderRadius: AVATAR_RADIUS,
    overflow: 'hidden',
    marginBottom: getResponsiveHeight(10),
    backgroundColor: '#E5E7EB',
    position: 'relative',
  },

  memoryImage: {
    width: '100%',
    alignSelf: 'center',
    aspectRatio: 4 / 3,
    borderRadius: AVATAR_RADIUS,
    resizeMode: 'cover',
    marginBottom: getResponsiveHeight(10),
    backgroundColor: '#E5E7EB',
  },

  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 22,
    borderTopWidth: 14,
    borderBottomWidth: 14,
    borderLeftColor: 'rgba(255,255,255,0.95)',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 5,
  },

  contentText: {
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(13),
    color: '#111827',
    lineHeight: getResponsiveHeight(19),
    marginBottom: getResponsiveHeight(3),
  },

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
  albumPlayTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 16,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: 'rgba(255,255,255,0.95)',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 4,
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
