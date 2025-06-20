import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {fetchMemoryThunk} from '../../redux/thunk/memoryThunk';
import {fetchCategoryThunk} from '../../redux/thunk/categoryThunk';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from '../../utils/responsive';
import {WINDOW_WIDTH} from '@gorhom/bottom-sheet';

const ITEM_MARGIN = getResponsiveWidth(4);

export default function MemoryFeed({
  selectedCategoryTitle,
  isGalleryView,
  setSelectedCategoryTitle,
}) {
  const familyId = useSelector(state => state.family.familyId);
  const {memoryList} = useSelector(state => state.memory);
  const categoryList = useSelector(state => state.category.categoryList);
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const category = route?.params?.category;

  useEffect(() => {
    if (category) setSelectedCategoryTitle(category.title);
  }, [category]);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchMemoryThunk(familyId));
      dispatch(fetchCategoryThunk(familyId));
    }, [familyId]),
  );

  const filteredMemoryList =
    selectedCategoryTitle === '전체'
      ? memoryList
      : memoryList.filter(memory => {
          const cat = categoryList.find(
            c => c.categoryId === memory.categoryId,
          );
          return cat?.title === selectedCategoryTitle;
        });

  const allImages = filteredMemoryList.flatMap(memory =>
    (memory.imageUrls || []).map(uri => ({
      uri,
      postId: memory.postId,
      memory,
    })),
  );

  const getCategoryLabel = id => {
    const found = categoryList.find(cat => cat.categoryId === id);
    return found ? found.title : '카테고리 없음';
  };

  const formatDate = d => {
    const date = new Date(d);
    const y = date.getFullYear();
    const m = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${y}.${m}.${day}`;
  };

  const renderListItem = ({item: memory}) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('게시글화면', {memory})}
      style={{paddingBottom: getResponsiveHeight(20)}}>
      <Text
        style={{
          marginBottom: getResponsiveHeight(5),
          fontSize: getResponsiveFontSize(12),
          fontFamily: 'Pretendard-Regular',
        }}>
        {formatDate(memory.createdAt)}
      </Text>
      <View>
        <Image
          style={styles.memoryImage}
          source={{uri: memory.imageUrls?.[0]}}
        />
        <Text style={styles.commentText}>댓글 {memory.commentCount}</Text>
      </View>
      <Text style={styles.categoryText}>
        {getCategoryLabel(memory.categoryId)}
      </Text>
      <Text style={styles.contentText}>{memory.content}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        key={isGalleryView ? 'gallery' : 'list'}
        data={isGalleryView ? allImages : filteredMemoryList}
        keyExtractor={(item, index) =>
          isGalleryView ? `${item.postId}-${index}` : `${item.postId}`
        }
        numColumns={isGalleryView ? 3 : 1}
        renderItem={({item}) =>
          isGalleryView ? (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('게시글화면', {memory: item.memory})
              }
              style={{
                width: (WINDOW_WIDTH - ITEM_MARGIN * 4) / 3,
                aspectRatio: 1,
                marginBottom: ITEM_MARGIN,
                marginRight: ITEM_MARGIN,
              }}>
              <Image source={{uri: item.uri}} style={styles.galleryImage} />
            </TouchableOpacity>
          ) : (
            renderListItem({item})
          )
        }
        columnWrapperStyle={
          isGalleryView ? {justifyContent: 'flex-start'} : undefined
        }
        contentContainerStyle={{
          paddingHorizontal: ITEM_MARGIN,
          paddingTop: ITEM_MARGIN,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: 'white'},
  galleryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: getResponsiveWidth(1),
  },
  memoryImage: {
    width: '100%',
    height: getResponsiveHeight(300),
    resizeMode: 'cover',
    marginBottom: getResponsiveHeight(10),
    borderRadius: getResponsiveWidth(4),
  },
  commentText: {
    position: 'absolute',
    right: getResponsiveWidth(8),
    bottom: getResponsiveHeight(17),
    zIndex: 5,
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Regular',
    color: 'white',
  },
  categoryText: {
    fontSize: getResponsiveFontSize(18),
    fontFamily: 'Pretendard-Regular',
    marginBottom: getResponsiveHeight(5),
  },
  contentText: {
    fontFamily: 'Pretendard-Light',
    fontSize: getResponsiveFontSize(12),
    maxHeight: getResponsiveHeight(50),
  },
});
