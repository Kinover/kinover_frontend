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
} from '../../../utils/responsive';
import CategoryModal from '../modules/upload/categoryModal';
import {
  createCategoryThunk,
  fetchCategoryThunk,
} from '../../../redux/thunk/categoryThunk';

export default function CategorySelectPage({route}) {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const familyId = useSelector(state => state.family.familyId);
  const {categoryList} = useSelector(state => state.category);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    if (familyId) dispatch(fetchCategoryThunk(familyId));
  }, [familyId]);

  useEffect(() => {
    if (categoryList.length > 0) {
      setSelectedCategory(categoryList[0]);
      setSelectedIndex(0);
    }
  }, [categoryList]);

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      const tempCategory = {
        categoryId: `temp-${Date.now()}`,
        title: newCategory.trim(),
        isTemporary: true,
      };
      const updated = [...categoryList, tempCategory];
      setNewCategory('');
      setAddModalVisible(false);
      setSelectedCategory(tempCategory);
      setSelectedIndex(updated.length - 1);
      dispatch({type: 'category/setTempCategoryList', payload: updated});
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>카테고리 선택</Text>
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
          style={styles.headerRight}>
          <Image
            source={require('../../../assets/icons/check.png')}
            style={styles.checkImage}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, selectedCategory]);

  const renderItem = ({item, index}) => {
    const isSelected = selectedIndex === index;
    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedIndex(index);
          setSelectedCategory(item);
        }}
        style={[styles.itemContainer, isSelected && styles.selectedItem]}>
        <Text style={styles.itemText}>{item.title}</Text>
        <TouchableOpacity>
          <Image
            source={
              isSelected
                ? require('../../../assets/images/selected-bt.png')
                : require('../../../assets/images/unselected-bt.png')
            }
            style={styles.radioIcon}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={categoryList}
        renderItem={renderItem}
        keyExtractor={(item, index) =>
          item.categoryId?.toString() || item.title
        }
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>새 카테고리를 입력해주세요</Text>
            <View style={styles.inputBox}>
              <TextInput
                placeholder="예: 2025 가족 여행"
                style={styles.input}
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
  headerCenter: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: getResponsiveFontSize(20),
    fontFamily: 'Pretendard-Regular',
    textAlign: 'center',
  },
  headerRight: {
    marginRight: getResponsiveWidth(10),
  },
  checkImage: {
    width: getResponsiveWidth(30),
    height: getResponsiveHeight(30),
    marginRight: getResponsiveWidth(15),
    resizeMode: 'contain',
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: getResponsiveWidth(20),
    paddingHorizontal: getResponsiveWidth(25),
  },
  selectedItem: {
    backgroundColor: '#FFF3D2',
  },
  itemText: {
    fontSize: getResponsiveFontSize(15),
    fontFamily: 'Pretendard-Regular',
  },
  radioIcon: {
    width: getResponsiveWidth(14),
    height: getResponsiveHeight(14),
    resizeMode: 'contain',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginHorizontal: getResponsiveWidth(10),
  },
  addButton: {
    paddingVertical: getResponsiveWidth(20),
    paddingHorizontal: getResponsiveWidth(25),
  },
  addText: {
    color: '#F8B500',
    fontSize: getResponsiveFontSize(15),
    fontFamily: 'Pretendard-Medium',
  },
  modalContent: {
    paddingHorizontal: getResponsiveWidth(10),
  },
  modalTitle: {
    fontSize: getResponsiveFontSize(18),
    fontFamily: 'Pretendard-SemiBold',
    textAlign: 'center',
    marginBottom: getResponsiveHeight(15),
    marginTop: getResponsiveHeight(15),
  },
  inputBox: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: getResponsiveWidth(10),
    paddingVertical: getResponsiveHeight(8),
  },
  input: {
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(14),
  },
});
