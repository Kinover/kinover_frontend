import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  Image,
  Text,
  FlatList,
  TouchableOpacity,
  Button,
  Dimensions,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import {useFocusEffect} from '@react-navigation/native';
import {useEffect} from 'react';
import {useRoute} from '@react-navigation/native';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveIconSize,
} from '../../utils/responsive';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {useCallback} from 'react';
import {fetchMemoryThunk} from '../../redux/thunk/memoryThunk';
import {fetchCategoryThunk} from '../../redux/thunk/categoryThunk';

export default function MemoryFeed() {
  const familyId = useSelector(state => state.family.familyId);
  const {memoryList} = useSelector(state => state.memory);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [isGalleryView, setIsGalleryView] = useState(false); // 스위치 상태 관리
  const categoryList = useSelector(state => state.category.categoryList);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();

  const ITEM_MARGIN = getResponsiveWidth(1);
  const NUM_COLUMNS = 3;
  const screenWidth = Dimensions.get('window').width; // 또는 Dimensions.get('window').width

  const itemSize =
    (screenWidth - ITEM_MARGIN * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

  const category = route?.params?.category;
  const [selectedCategoryTitle, setSelectedCategoryTitle] = useState('전체');

  // ✅ 조건에 따라 memory 필터링
  const filteredMemoryList =
    selectedCategoryTitle === '전체'
      ? memoryList
      : memoryList.filter(memory => {
          const category = categoryList.find(
            cat => cat.categoryId === memory.categoryId,
          );
          return category?.title === selectedCategoryTitle;
        });

  useEffect(() => {
    if (category) {
      setSelectedCategoryTitle(category.title);
    }
  }, [category]);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchMemoryThunk(familyId));
      dispatch(fetchCategoryThunk(familyId));
    }, [familyId]),
  );

  const formatDate = dateString => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  // 갤러리 뷰에서 여러 메모리를 렌더링
  const renderMemoryGallery = () => {
    return (
      <View style={{flex: 1, padding: ITEM_MARGIN}}>
        <FlatList
          data={filteredMemoryList}
          renderItem={({item}) => (
            <TouchableOpacity
              onPress={() => navigation.navigate('게시글화면', {memory: item})}
              style={[
                styles.galleryItem,
                {width: itemSize, height: itemSize, padding: ITEM_MARGIN},
              ]}>
              <Image
                style={styles.galleryImage}
                source={{uri: item.imageUrls[0]}}
              />
            </TouchableOpacity>
          )}
          keyExtractor={item => item.postId}
          numColumns={3}
          columnWrapperStyle={[styles.galleryRow, {padidng: ITEM_MARGIN}]}
          scrollEnabled={false}
        />
      </View>
    );
  };

  const getCategoryLabel = categoryId => {
    const found = categoryList.find(cat => cat.categoryId === categoryId);
    return found ? found.title : '카테고리 없음';
  };

  return (
    <View style={styles.contentElement}>
      <View style={styles.lineContainer}>
        <TouchableOpacity
          style={[styles.categoryButton]}
          onPress={() => navigation.navigate('카테고리화면')}>
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: getResponsiveWidth(9),
            }}>
            <Text style={styles.categoryButtonText}>
              {selectedCategoryTitle}
            </Text>
            <Image
              style={{
                resizeMode: 'contain',
                width: getResponsiveWidth(12),
                height: getResponsiveHeight(9),
              }}
              source={require('../../assets/images/down-yellow.png')}
            />
          </View>
        </TouchableOpacity>
        <View
          style={{
            width: getResponsiveWidth(80),
            height: getResponsiveHeight(35),
            justifyContent: 'center',
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: getResponsiveWidth(10),
          }}>
          <TouchableOpacity onPress={() => setIsGalleryView(true)}>
            <Image
              source={
                isGalleryView
                  ? require('../../assets/images/grid_on.png')
                  : require('../../assets/images/grid_off.png')
              }
              style={styles.gallery_bt}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsGalleryView(false)}>
            <Image
              source={
                !isGalleryView
                  ? require('../../assets/images/list_on.png')
                  : require('../../assets/images/list_off.png')
              }
              style={styles.gallery_bt}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* 갤러리뷰 & 리스트뷰 조건부 렌더링 */}
      {isGalleryView ? (
        renderMemoryGallery()
      ) : (
        <View style={styles.memoryContainer}>
          {filteredMemoryList.map(memory => (
            <View key={memory.postId}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('게시글화면', {memory: memory})
                }
                key={memory.postId}
                style={{backgroundColor: 'white'}}>
                <Text style={{marginBottom: getResponsiveHeight(5)}}>
                  {formatDate(memory.createdAt)}
                </Text>
                <View style={styles.memoryImageContainer}>
                  <View style={{position: 'relative', flex: 1}}>
                    <Image
                      style={styles.memoryImage}
                      source={{uri: memory.imageUrls[0]}}
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
                  <Text
                    style={{
                      fontSize: getResponsiveFontSize(22),
                      fontFamily: 'Pretendard-Regualr',
                      marginBottom: getResponsiveHeight(5),
                      paddingHorizontal: getResponsiveWidth(3),
                    }}>
                    {getCategoryLabel(memory.categoryId)}
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'Pretendard-Light',
                      fontSize: getResponsiveFontSize(12),
                      maxHeight: getResponsiveHeight(50),
                      paddingHorizontal: getResponsiveWidth(3),
                    }}>
                    {memory.content}
                  </Text>
                </View>
              </TouchableOpacity>
              <View style={styles.bar}></View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  categoryButton: {
    paddingVertical: getResponsiveHeight(5),
    backgroundColor: 'white',
    paddingHorizontal: getResponsiveWidth(3),
  },

  categoryButtonText: {
    fontFamily: 'Pretendard-SemiBold',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: getResponsiveFontSize(19),
    color: '#FFC84D',
  },

  galleryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  galleryContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // paddingHorizontal:
    // backgroundColor:'black',
  },

  contentElement: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    gap: getResponsiveHeight(10),
    // marginBottom: getResponsiveHeight(20),
    position: 'relative',
  },

  // 메모리 전체
  memoryContainer: {
    display: 'flex',
    flex:1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    width: '100%',
    paddingHorizontal: getResponsiveWidth(10),
  },

  // 멤버
  memberContainer: {
    display: 'flex',
    flexDirection: 'row',
    paddingTop: getResponsiveIconSize(5),
    backgroundColor: '#fff',
    gap: getResponsiveWidth(15),
    height: getResponsiveHeight(60),
  },

  // 멤버 text
  memberBox: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: getResponsiveIconSize(10),
    justifyContent: 'flex-start',
    width: '100%',
    height: getResponsiveHeight(40),
  },

  memberImage: {
    width: getResponsiveWidth(40),
    height: getResponsiveHeight(40),
    borderColor: 'lightgray',
    borderWidth: getResponsiveIconSize(0.7),
    borderRadius: getResponsiveIconSize(20),
    resizeMode: 'cover',
  },

  memberName: {
    fontSize: getResponsiveFontSize(14),
    marginTop: getResponsiveIconSize(5),
    marginBottom: getResponsiveIconSize(5),
  },

  memoryDescription: {
    fontSize: getResponsiveFontSize(10),
  },

  memoryImageContainer: {
    display: 'flex',
    alignSelf: 'center',
    width: '100%',
    height: getResponsiveHeight(300),
  },

  memoryImage: {
    flex: 1,
    // borderRadius: getResponsiveIconSize(15),
    resizeMode: 'cover',
    marginBottom: getResponsiveHeight(10),
  },

  dropdown: {
    fontFamily: 'Pretendard-Regular',
    width: getResponsiveWidth(80),
    borderWidth: 0,
  },

  dropDownContainer: {
    borderColor: '#FFC84D', // 테두리 색상 변경
    borderWidth: 1, // 테두리 두께 변경
    borderRadius: 5, // 모서리 둥글게
  },

  lineContainer: {
    position: 'relative',
    width: '100%',
    height: 'auto',
    paddingVertical: getResponsiveHeight(7),
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getResponsiveWidth(10),
  },

  switch: {
    // width:getResponsiveHeight(20),
  },

  gallery_bt: {
    width: getResponsiveWidth(30),
    height: getResponsiveHeight(30),
    resizeMode: 'contain',
  },

  bar: {
    width: '120%',
    backgroundColor: '#D9D9D9',
    height: getResponsiveHeight(2),
    marginTop: getResponsiveHeight(15),
    marginBottom: getResponsiveHeight(15),
    marginLeft: -20,
  },

  galleryItem: {
    borderRadius: 0,
    overflow: 'hidden',
  },

  galleryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  galleryRow: {
    justifyContent: 'space-between',
    // marginBottom: ITEM_MARGIN,
  },
});
