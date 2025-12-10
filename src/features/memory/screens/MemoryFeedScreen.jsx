/* eslint-disable react-native/no-inline-styles */
import React, {useCallback, useMemo, useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, FlatList} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {PinchGestureHandler, State} from 'react-native-gesture-handler';

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
import {Shadow} from 'react-native-shadow-2';

const ITEM_MARGIN = getResponsiveWidth(2);
const fallbackImage = require('../../../assets/images/default.png');
const AVATAR_RADIUS = getResponsiveWidth(8);
const CARD_RADIUS = getResponsiveIconSize(10);

export default function MemoryFeed({
  selectedCategoryTitle,
  selectedTab,
  startDate,
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

  const allPhotos = useMemo(
    () =>
      filteredMemoryList.flatMap(memory =>
        (memory.imageUrls || []).map(uri => ({
          uri,
          postId: memory.postId,
          memory,
        })),
      ),
    [filteredMemoryList],
  );

  const isAllPhotos = selectedTab === 'album';
  const data = isAllPhotos ? allPhotos : filteredMemoryList;

  // 🔹 그리드 한 칸의 너비 (컬럼 개수에 따라 자동 조정)
  const tileWidth = useMemo(() => {
    const columns = gridColumns;
    const totalMargin = ITEM_MARGIN * (columns + 1); // 양옆 + 중간 간격
    return (WINDOW_WIDTH - totalMargin) / columns;
  }, [gridColumns]);

  // 🔹 핀치 제스처로 gridColumns 2~4 사이에서 변경
  const handlePinchStateChange = event => {
    const {state, oldState, scale} = event.nativeEvent;

    if (oldState === State.ACTIVE && state === State.END) {
      setGridColumns(prev => {
        // 손가락 벌리기 → 확대 → 컬럼 줄이기
        if (scale > 1.05 && prev > 2) {
          return prev - 1;
        }
        // 손가락 오므리기 → 축소 → 컬럼 늘리기
        if (scale < 0.95 && prev < 4) {
          return prev + 1;
        }
        return prev;
      });
    }
  };

  const renderListItem = memory => {
    const imageCount = memory?.imageUrls?.length || 0;

    return (
      <Shadow
        key={memory.postId}
        distance={0.2}
        offset={[0, 13.5]}
        startColor="rgba(15, 23, 42, 0.12)"
        endColor="rgba(15, 23, 42, 0.0)"
        radius={CARD_RADIUS}
        style={{
          width: '100%',
          position: 'relative',
          justifyContent: 'center',
          alignSelf: 'center',
          alignItems: 'center',
          borderRadius: CARD_RADIUS,
          marginVertical: getResponsiveHeight(8),
          paddingVertical: getResponsiveHeight(3),
        }}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('게시글화면', {memory})}
          style={styles.memoryItem}>
          <View style={styles.topRow}>
            <Text style={styles.dateText}>{formatDate(memory.createdAt)}</Text>

            <View style={styles.badgeRow}>
              <View style={styles.commentBadge}>
                <Text style={styles.badgeText}>댓글 {memory.commentCount}</Text>
              </View>
              {imageCount > 0 && (
                <View style={styles.imageCountBadge}>
                  <Text style={styles.badgeText}>사진 {imageCount}장</Text>
                </View>
              )}
            </View>
          </View>

          <FastImage
            style={styles.memoryImage}
            source={
              memory.imageUrls?.[0] ? {uri: memory.imageUrls[0]} : fallbackImage
            }
          />

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
      </Shadow>
    );
  };

  const renderImageItem = ({item, index}) => {
    const imageIndexInPost = item.memory?.imageUrls?.findIndex(
      uri => uri === item.uri,
    );

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        key={`${item.uri}_${index}`}
        onPress={() =>
          navigation.navigate('게시글화면', {
            memory: item.memory,
            imageIndex: imageIndexInPost,
          })
        }
        style={{
          width: tileWidth,
          aspectRatio: 1,
          marginBottom: ITEM_MARGIN,
        }}>
        <FastImage
          source={item.uri ? {uri: item.uri} : fallbackImage}
          style={styles.galleryImage}
        />
      </TouchableOpacity>
    );
  };

  // ====== 로딩 스켈레톤 ======
  if (isLoading) {
    // ✅ 앨범 탭일 때: 4열 그리드 스켈레톤
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

    // ✅ 게시글 탭일 때: 기존 카드형 스켈레톤
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

  return (
    <View
      style={[
        styles.container,
        !isAllPhotos && styles.postContainer,
      ]}>
      {isAllPhotos ? (
        // 🔹 앨범 탭: 핀치 제스처로 그리드 조절
        <PinchGestureHandler onHandlerStateChange={handlePinchStateChange}>
          <View>
            <FlatList
              key={`album-${gridColumns}`}
              data={data}
              showsVerticalScrollIndicator={false}
              keyExtractor={(item, index) => `${item.uri}_${index}`}
              numColumns={gridColumns}
              renderItem={renderImageItem}
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
          </View>
        </PinchGestureHandler>
      ) : (
        // 🔹 게시글 탭: 기존 카드형 리스트
        <FlatList
          key="post"
          data={data}
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
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  postContainer: {
    marginHorizontal: '2%',
  },

  memoryItem: {
    width: '98%',
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
    fontSize: getResponsiveFontSize(12),
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
    fontSize: getResponsiveFontSize(11.5),
    fontFamily: 'Pretendard-Medium',
    color: '#4B5563',
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
