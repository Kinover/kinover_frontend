import React, {useState, useLayoutEffect, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Platform
} from 'react-native';
import { useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import  {getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../../utils/responsive';
import CategoryModal from '../components/CategoryModal';
import {  fetchCategoryThunk,
} from '../store/categoryThunk';
import {SafeAreaView} from 'react-native-safe-area-context';

export default function CategorySelectPage({route}) {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const familyId = useSelector(state => state.family.familyId);
  const {categoryList} = useSelector(state => state.category);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newCategory, setNewCategory] = useState('');



  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>카테고리 지정</Text>
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
      // ✅ headerLeft 커스텀: 소통 스택 루트로 이동
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => {
            // if (route.params?.selectedImages?.length > 0) {
            //   // 업로드 플로우 → 소통 스택 루트로 이동
            // navigation.navigate('', {screen: '소통화면'});
            // } else {
            navigation.goBack();
            // }
          }}
          style={{marginLeft: getResponsiveWidth(20)}}>
          <Image
            source={require('../../../assets/icons/caretDown.png')}
            style={{
              width: getResponsiveWidth(30),
              height: getResponsiveHeight(30),
              resizeMode: 'contain',
            }}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, selectedCategory, route.params?.selectedImages]);

  useEffect(() => {
    if (familyId) dispatch(fetchCategoryThunk(familyId));
  }, [dispatch, familyId]);

  useEffect(() => {
    if (categoryList.length > 0) {
      setSelectedCategory(categoryList[0]);
      setSelectedIndex(0);
    }
  }, [categoryList]);

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      const tempCategory = {
        categoryId: null, // ← UUID로 대체!
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
          <Text style={styles.headerTitle}>카테고리 지정</Text>
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
  }, [navigation, route.params?.selectedImages, selectedCategory]);

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
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={categoryList}
        renderItem={renderItem}
        keyExtractor={(item, index) =>
          `${item.categoryId || item.title}-${index}`
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setAddModalVisible(true)}>
              <Text style={styles.addText}>카테고리 추가</Text>
            </TouchableOpacity>
            <View style={styles.separator} />
          </>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    borderTopWidth: 2,
    borderColor: '#E5E5E5',
  },
  headerCenter: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize:
      Platform.OS === 'ios'
        ? getResponsiveFontSize(20)
        : getResponsiveFontSize(18),
    textAlign: 'center',
    textAlignVertical: 'center',
    fontFamily: 'Pretendard-Regular',
    fontWeight: 'semibold',
    color: '#101010',
    lineHeight: getResponsiveHeight(30),
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
    alignItems: 'center',
    alignContent: 'center',
    paddingVertical: getResponsiveWidth(22.5),
    paddingHorizontal: getResponsiveWidth(25),
  },
  selectedItem: {
    backgroundColor: '#FFF3D2',
  },
  itemText: {
    fontSize: getResponsiveFontSize(15),
    fontFamily: 'Pretendard-Regular',
    color: 'black',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  radioIcon: {
    width: getResponsiveWidth(15),
    height: getResponsiveHeight(15),
    resizeMode: 'contain',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginHorizontal: getResponsiveWidth(5),
  },
  addButton: {
    paddingVertical: getResponsiveWidth(22.5),
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
    color: 'black',
    fontSize:
      Platform.OS === 'android'
        ? getResponsiveFontSize(20)
        : getResponsiveFontSize(22),
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
    paddingVertical:
      Platform.OS === 'ios' ? getResponsiveHeight(12) : getResponsiveHeight(2),
  },
  input: {
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(16),
  },
});
