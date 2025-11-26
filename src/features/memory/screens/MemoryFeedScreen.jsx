/* eslint-disable react-native/no-inline-styles */
import React, {useCallback, useMemo} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, FlatList} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
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

const ITEM_MARGIN = getResponsiveWidth(2);
const fallbackImage = require('../../../assets/images/default.png');

export default function MemoryFeed({selectedCategoryTitle, selectedTab}) {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const familyId = useSelector(state => state.family.familyId);
  const {memoryList = []} = useSelector(state => state.memory);
  const categoryList = useSelector(state => state.category.categoryList || []);

  // 화면 포커스 시 메모리 & 카테고리 재조회
  useFocusEffect(
    useCallback(() => {
      if (!familyId) return;
      dispatch(fetchMemoryThunk(familyId));
      dispatch(fetchCategoryThunk(familyId));
    }, [dispatch, familyId]),
  );

  const isLoading = !memoryList || memoryList.length === 0;

  // ====== 공통 유틸 ======
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

  // 필터링
  const filteredMemoryList = useMemo(() => {
    if (selectedCategoryTitle === '전체') return memoryList;
    return memoryList.filter(memory => {
      const cat = categoryList.find(c => c.categoryId === memory.categoryId);
      return cat?.title === selectedCategoryTitle;
    });
  }, [memoryList, categoryList, selectedCategoryTitle]);

  // 전체 사진(flat)
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

  // ====== 렌더러들 ======
  const renderListItem = memory => {
    const imageCount = memory?.imageUrls?.length || 0;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        key={memory.postId}
        onPress={() => navigation.navigate('게시글화면', {memory})}
        style={styles.memoryItem}>
        {/* 상단: 날짜 + 댓글/사진 배지 */}
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

        {/* 메인 이미지 */}
        <FastImage
          style={styles.memoryImage}
          source={
            memory.imageUrls?.[0] ? {uri: memory.imageUrls[0]} : fallbackImage
          }
        />

        {/* 카테고리 뱃지 */}
        {/* <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>
            {getCategoryLabel(memory.categoryId)}
          </Text>
        </View> */}

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

        {/* 내용 미리보기 */}
        {!!memory.content && (
          <Text
            style={styles.contentText}
            numberOfLines={2}
            ellipsizeMode="tail">
            {memory.content}
          </Text>
        )}
      </TouchableOpacity>
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
          width: (WINDOW_WIDTH - ITEM_MARGIN * 3) / 4,
          aspectRatio: 1,
        }}>
        <FastImage
          source={item.uri ? {uri: item.uri} : fallbackImage}
          style={styles.galleryImage}
        />
      </TouchableOpacity>
    );
  };

  const isAllPhotos = selectedTab === 'album';
  const data = isAllPhotos ? allPhotos : filteredMemoryList;

  // ====== 로딩 스켈레톤 ======
  if (isLoading) {
    return (
      <View style={{flex: 1, paddingTop: 4, backgroundColor: '#F3F4F6'}}>
        {selectedTab === 'allPhotos' ? (
          <FlatList
            data={Array(12).fill(0)}
            numColumns={4}
            columnWrapperStyle={{gap: ITEM_MARGIN}}
            keyExtractor={(_, idx) => `skeleton-photo-${idx}`}
            renderItem={() => <SkeletonPhotoGridItem />}
          />
        ) : (
          <FlatList
            data={Array(5).fill(0)}
            keyExtractor={(_, idx) => `skeleton-memory-${idx}`}
            renderItem={() => <SkeletonMemoryItem />}
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        key={isAllPhotos ? 'post' : 'album'}
        data={data}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item, index) =>
          isAllPhotos
            ? `${item.uri}_${index}`
            : item.postId?.toString() || `no-id-${index}`
        }
        numColumns={isAllPhotos ? 4 : 1}
        renderItem={
          isAllPhotos ? renderImageItem : ({item}) => renderListItem(item)
        }
        columnWrapperStyle={
          isAllPhotos
            ? {justifyContent: 'flex-start', gap: ITEM_MARGIN}
            : undefined
        }
        contentContainerStyle={{
          paddingTop: ITEM_MARGIN,
          paddingBottom: getResponsiveHeight(24),
          gap: ITEM_MARGIN,
        }}
        ListEmptyComponent={
          !isAllPhotos ? (
            <View style={styles.emptyWrapper}>
              <Text style={styles.emptyText}>아직 등록된 추억이 없어요.</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const AVATAR_RADIUS = getResponsiveWidth(8);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },

  // ====== 카드형 앨범 아이템 ======
  memoryItem: {
    marginHorizontal: getResponsiveWidth(18),
    marginVertical: getResponsiveHeight(8),
    paddingHorizontal: getResponsiveWidth(16),
    paddingVertical: getResponsiveHeight(14),
    backgroundColor: '#FFFFFF',
    borderRadius: getResponsiveIconSize(10),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowRadius: 6,
    shadowOpacity: 0.04,
    shadowOffset: {width: 0, height: 3},
    elevation: 2,
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

  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: getResponsiveWidth(8),
    paddingVertical: getResponsiveHeight(4),
    borderRadius: 999,
    backgroundColor: '#F3F4FF',
    marginBottom: getResponsiveHeight(6),
  },
  categoryText: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-SemiBold',
    color: '#4B5563',
  },

  contentText: {
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(13),
    color: '#111827',
    lineHeight: getResponsiveHeight(19),
    marginBottom: getResponsiveHeight(3),
  },

  // ====== 전체 사진 그리드 ======
  galleryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    backgroundColor: '#E5E7EB',
  },

  // ====== 빈 상태 ======
  emptyWrapper: {
    paddingTop: getResponsiveHeight(60),
    alignItems: 'center',
  },
  emptyText: {
    fontSize: getResponsiveFontSize(13.5),
    fontFamily: 'Pretendard-Regular',
    color: '#9CA3AF',
  },
});
