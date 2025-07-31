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
import {fetchMemoryThunk} from '../../../redux/thunk/memoryThunk';
import {fetchCategoryThunk} from '../../../redux/thunk/categoryThunk';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from '../../../utils/responsive';

import {WINDOW_WIDTH} from '@gorhom/bottom-sheet';

const ITEM_MARGIN = getResponsiveWidth(2);

export default function MemoryFeed({selectedCategoryTitle, selectedTab}) {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();
  const familyId = useSelector(state => state.family.familyId);
  const {memoryList} = useSelector(state => state.memory);
  const categoryList = useSelector(state => state.category.categoryList);
  const category = route?.params?.category;

  useEffect(() => {
    if (category) setTitle(category.title);
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

  const allPhotos = filteredMemoryList.flatMap(memory =>
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

  const formatDate = dateStr => {
    const date = new Date(dateStr);
    const y = date.getFullYear();
    const m = `${date.getMonth() + 1}`.padStart(2, '0');
    const d = `${date.getDate()}`.padStart(2, '0');
    return `${y}.${m}.${d}`;
  };

  const renderListItem = memory => (
    <TouchableOpacity
      key={memory.postId}
      onPress={() => navigation.navigate('게시글화면', {memory})}
      style={styles.memoryItem}>
      <Text style={styles.dateText}>{formatDate(memory.createdAt)}</Text>
      <Image style={styles.memoryImage} source={{uri: memory.imageUrls?.[0]}} />
      <Text style={styles.commentText}>댓글 {memory.commentCount}</Text>
      <Text style={styles.categoryText}>
        {getCategoryLabel(memory.categoryId)}
      </Text>
      <Text style={styles.contentText}>{memory.content}</Text>
    </TouchableOpacity>
  );

  const renderImageItem = ({item, index}) => {
    const imageIndexInPost = item.memory?.imageUrls?.findIndex(
      uri => uri === item.uri,
    );
    return (
      <TouchableOpacity
        key={`${item.uri}_${index}`}
        onPress={() =>
          navigation.navigate('게시글화면', {
            memory: item.memory,
            imageIndex: imageIndexInPost, // ✅ 추가
          })
        }
        style={{
          width: (WINDOW_WIDTH - ITEM_MARGIN * 4) / 4,
          aspectRatio: 1,
          marginBottom: ITEM_MARGIN,
          marginRight: ITEM_MARGIN,
        }}>
        <Image source={{uri: item.uri}} style={styles.galleryImage} />
      </TouchableOpacity>
    );
  };

  const isAllPhotos = selectedTab === 'allPhotos';
  const data = isAllPhotos ? allPhotos : filteredMemoryList;

  return (
    <View style={styles.container}>
      <FlatList
        key={isAllPhotos ? 'allPhotos' : 'album'}
        data={data}
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
          isAllPhotos ? {justifyContent: 'flex-start'} : undefined
        }
        contentContainerStyle={{
          paddingTop: ITEM_MARGIN,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9F9F9'},
  memoryItem: {
    paddingVertical: getResponsiveHeight(20),
    paddingHorizontal: getResponsiveWidth(30),
    paddingBottom: getResponsiveHeight(20),
    width: '90%',
    alignSelf: 'center',
    backgroundColor: 'white',
    borderRadius: getResponsiveIconSize(10),
    shadowRadius: 1,
    shadowOpacity: 0.2,
    shadowOffset: {width: 0, height: 3},
    marginVertical: 15,
    elevation: 4,
  },
  dateText: {
    marginBottom: getResponsiveHeight(5),
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Regular',
    color: '#333',
  },
  memoryImage: {
    width: '100%',
    alignSelf: 'center',
    aspectRatio: 4 / 3,
    resizeMode: 'cover',
    marginBottom: getResponsiveHeight(10),
  },
  commentText: {
    position: 'absolute',
    right: getResponsiveWidth(28),
    bottom: getResponsiveHeight(27),
    zIndex: 5,
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Regular',
    color: 'white',
  },
  categoryText: {
    fontSize: getResponsiveFontSize(18),
    fontFamily: 'Pretendard-Regular',
    marginBottom: getResponsiveHeight(5),
    color: '#333',
  },
  contentText: {
    fontFamily: 'Pretendard-Light',
    fontSize: getResponsiveFontSize(12),
    maxHeight: getResponsiveHeight(50),
    color: '#444',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: getResponsiveWidth(1),
  },
});
