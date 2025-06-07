// ✅ memoryFeed 리팩토링: ScrollView 제거하고 FlatList/MasonryList가 최상위 스크롤 담당
import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from 'react-native';
const ITEM_MARGIN = getResponsiveWidth(4); // 예: 각 이미지 간 마진
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import MasonryList from 'react-native-masonry-list';
import {fetchMemoryThunk} from '../../redux/thunk/memoryThunk';
import {fetchCategoryThunk} from '../../redux/thunk/categoryThunk';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from '../../utils/responsive';
import {WINDOW_WIDTH} from '@gorhom/bottom-sheet';

export default function MemoryFeed() {
  const familyId = useSelector(state => state.family.familyId);
  const {memoryList} = useSelector(state => state.memory);
  const categoryList = useSelector(state => state.category.categoryList);
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const category = route?.params?.category;

  const [selectedCategoryTitle, setSelectedCategoryTitle] = useState('전체');
  const [isGalleryView, setIsGalleryView] = useState(false);

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
      <Text style={{marginBottom: getResponsiveHeight(5)}}>
        {formatDate(memory.createdAt)}
      </Text>
      <View>
        <Image
          style={styles.memoryImage}
          source={{uri: memory.imageUrls?.[0]}}
        />
        <Text
          style={{
            position: 'absolute',
            right: getResponsiveWidth(8),
            bottom: getResponsiveHeight(17),
            zIndex: 5,
            fontSize: getResponsiveFontSize(17),
            fontFamily: 'Pretendard-Regular',
            color: 'white',
          }}>
          댓글 {memory.commentCount}
        </Text>
      </View>
      <Text style={styles.categoryText}>
        {getCategoryLabel(memory.categoryId)}
      </Text>
      <Text style={styles.contentText}>{memory.content}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 상단 필터 */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.categoryButton}
          onPress={() => navigation.navigate('카테고리화면')}>
          <Text style={styles.categoryButtonText}>{selectedCategoryTitle}</Text>
          <Image
            source={require('../../assets/images/down-yellow.png')}
            style={styles.arrowIcon}
          />
        </TouchableOpacity>
        <View style={styles.toggleContainer}>
          <TouchableOpacity onPress={() => setIsGalleryView(true)}>
            <Image
              source={
                isGalleryView
                  ? require('../../assets/images/grid_on.png')
                  : require('../../assets/images/grid_off.png')
              }
              style={styles.galleryIcon}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsGalleryView(false)}>
            <Image
              source={
                !isGalleryView
                  ? require('../../assets/images/list_on.png')
                  : require('../../assets/images/list_off.png')
              }
              style={styles.galleryIcon}
            />
          </TouchableOpacity>
        </View>
      </View>
      {/* 목록 */}
      {isGalleryView ? (
        <FlatList
          key={isGalleryView ? 'gallery' : 'list'} // ✅ key가 바뀌면 FlatList 전체 재렌더링됨
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
                <Image
                  source={{uri: item.uri}}
                  style={{
                    width: '100%',
                    height: '100%',
                    resizeMode: 'cover',
                    borderRadius: 1,
                  }}
                />
              </TouchableOpacity>
            ) : (
              renderListItem({item}) // 기존 리스트 렌더 함수 재활용
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
      ) : (
        <FlatList
          data={filteredMemoryList}
          renderItem={renderListItem}
          keyExtractor={item => String(item.postId)}
          contentContainerStyle={{paddingHorizontal: getResponsiveWidth(10)}}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: 'white'},
  headerContainer: {
    paddingVertical: getResponsiveHeight(10),
    paddingHorizontal: getResponsiveWidth(10),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(5),
  },
  categoryButtonText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(19),
    color: '#FFC84D',
  },
  arrowIcon: {
    resizeMode: 'contain',
    width: getResponsiveWidth(12),
    height: getResponsiveHeight(9),
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: getResponsiveWidth(10),
  },
  galleryIcon: {
    width: getResponsiveWidth(30),
    height: getResponsiveHeight(30),
    resizeMode: 'contain',
  },
  memoryImage: {
    width: '100%',
    height: getResponsiveHeight(300),
    resizeMode: 'cover',
    marginBottom: getResponsiveHeight(10),
  },
  categoryText: {
    fontSize: getResponsiveFontSize(22),
    fontFamily: 'Pretendard-Regular',
    marginBottom: getResponsiveHeight(5),
  },
  contentText: {
    fontFamily: 'Pretendard-Light',
    fontSize: getResponsiveFontSize(12),
    maxHeight: getResponsiveHeight(50),
  },
});
