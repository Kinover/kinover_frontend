import React, {useState, useLayoutEffect, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import getResponsiveFontSize, {
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../utils/responsive';
import CategoryModal from '../../utils/categoryModal';
import {
  createCategoryThunk,
  fetchCategoryThunk,
} from '../../redux/thunk/categoryThunk';

export default function CategorySelectPage({route}) {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const family = useSelector(state => state.family);
  const familyId = useSelector(state => state.family.familyId);
  const {categoryList, isLoading} = useSelector(state => state.category);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  // ✅ 서버에서 카테고리 불러오기
  useEffect(() => {
    if (familyId) {
      dispatch(fetchCategoryThunk(familyId));
    }
  }, [familyId]);

  useEffect(() => {
    if (categoryList.length > 0) {
      setSelectedCategory(categoryList[0]);
      setSelectedIndex(0);
    }
  }, [categoryList]);

  // ✅ 새 카테고리 생성
  const handleAddCategory = async () => {
    if (newCategory.trim()) {
      try {
        const resultAction = await dispatch(
          createCategoryThunk({
            title: newCategory.trim(),
            familyId: String(familyId),
          }),
        );

        if (createCategoryThunk.fulfilled.match(resultAction)) {
          const created = resultAction.payload;
          const newIndex = categoryList.length;
          setSelectedCategory(created);
          setSelectedIndex(newIndex);
          setNewCategory('');
          setAddModalVisible(false);
        } else {
          throw new Error('카테고리 생성 실패');
        }
      } catch (err) {
        alert('카테고리 생성 실패');
      }
    }
  };

  // ✅ 상단 헤더
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View
          style={{
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text
            style={{fontSize: getResponsiveFontSize(20), textAlign: 'center'}}>
            카테고리 선택
          </Text>
        </View>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            if (selectedCategory) {
              navigation.navigate('게시글작성화면', {
                selectedCategory,
                selectedImages: route.params?.selectedImages,
              });
            }
          }}
          style={{marginRight: 15}}>
          <Image
            source={require('../../assets/images/check-bt.png')}
            style={{
              width: 25,
              height: 25,
              resizeMode: 'contain',
              right: getResponsiveWidth(10),
            }}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, selectedCategory]);

  // ✅ 항목 렌더링
  const renderItem = ({item, index}) => (
    <TouchableOpacity
      onPress={() => {
        setSelectedIndex(index);
        setSelectedCategory(item);
      }}
      style={[
        styles.itemContainer,
        selectedIndex === index && styles.selectedItem,
      ]}>
      <Text style={styles.itemText}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={categoryList}
        renderItem={renderItem}
        keyExtractor={(item, index) => item.categoryId || index.toString()}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListFooterComponent={
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setAddModalVisible(true)}>
            <Text style={styles.addText}>카테고리 추가</Text>
          </TouchableOpacity>
        }
      />
      <CategoryModal
        visible={addModalVisible}
        onClose={() => {
          setNewCategory('');
          setAddModalVisible(false);
        }}
        onConfirm={handleAddCategory}
        content={
          <View style={{paddingHorizontal: 0}}>
            <Text
              style={{
                fontSize: getResponsiveFontSize(18),
                fontFamily: 'Pretendard-SemiBold',
                textAlign: 'center',
                marginBottom: getResponsiveHeight(15),
                marginTop: getResponsiveHeight(15),
              }}>
              새 카테고리를 입력해주세요
            </Text>
            <View
              style={{
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 8,
              }}>
              <TextInput
                placeholder="예: 2025 가족 여행"
                style={{
                  fontFamily: 'Pretendard-Regular',
                  fontSize: getResponsiveFontSize(14),
                }}
                value={newCategory}
                onChangeText={setNewCategory}
              />
            </View>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    borderTopWidth: 3,
    borderColor: '#D3D3D3',
  },
  itemContainer: {
    paddingVertical: 16,
    paddingHorizontal: getResponsiveWidth(20),
  },
  selectedItem: {
    backgroundColor: '#FFF3D2',
  },
  itemText: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Regular',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginHorizontal: getResponsiveWidth(10),
  },
  addButton: {
    paddingVertical: 16,
    paddingHorizontal: getResponsiveWidth(20),
  },
  addText: {
    color: '#F8B500',
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Regular',
  },
});
