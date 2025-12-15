// src/features/memory/screens/CategorySelectScreen.jsx

import React, {useState, useLayoutEffect, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Platform,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../../utils/responsive';
import CategoryModal from '../components/CategoryModal';
import {fetchCategoryThunk} from '../store/categoryThunk';
import {SafeAreaView} from 'react-native-safe-area-context';
import {EMPTY_STYLE, HEADER_STYLES} from 'styles/style';
import uuid from 'react-native-uuid';

export default function CategorySelectPage({route}) {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const familyId = useSelector(state => state.family.familyId);
  const {categoryList} = useSelector(state => state.category);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  // ✅ 전달받은 selectedImages (string[] or object[] 모두 가능)
  const selectedImagesFromRoute = useMemo(
    () => route?.params?.selectedImages ?? [],
    [route?.params?.selectedImages],
  );
  // 디버깅용
  useEffect(() => {
    console.log('📂 CategorySelectPage 진입');
    console.log('📂 route.params:', route?.params);
  }, [route]);

  useEffect(() => {
    console.log('👨‍👩‍👧‍👦 familyId 변경:', familyId);
  }, [familyId]);

  useEffect(() => {
    console.log('📋 categoryList 변경감지:', categoryList);
  }, [categoryList]);

  useEffect(() => {
    console.log('✅ 현재 선택된 카테고리(selectedCategory):', selectedCategory);
    console.log('✅ 현재 선택 인덱스(selectedIndex):', selectedIndex);
  }, [selectedCategory, selectedIndex]);

  // 헤더 설정
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => <Text style={styles.headerTitle}>카테고리 지정</Text>,
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            console.log('✅ 헤더 확인 버튼 클릭');
            console.log(
              '➡️ 게시글작성화면으로 이동, selectedCategory:',
              selectedCategory,
            );
            console.log('➡️ 전달할 selectedImages:', selectedImagesFromRoute);

            if (selectedCategory) {
              navigation.navigate('게시글작성화면', {
                selectedCategory,
                selectedImages: selectedImagesFromRoute,
              });
            } else {
              console.log('❌ selectedCategory 없음, 이동 안 함');
            }
          }}
          style={styles.headerRight}>
          <Image
            source={require('../../../assets/icons/check.png')}
            style={styles.checkImage}
          />
        </TouchableOpacity>
      ),
      // headerLeft: () => (
      //   <TouchableOpacity
      //     onPress={() => {
      //       console.log('⬅️ 카테고리 선택 화면 뒤로가기');
      //       navigation.goBack();
      //     }}
      //     style={{marginLeft: getResponsiveWidth(20)}}>
      //     <Image
      //       source={require('../../../assets/icons/caretDown.png')}
      //       style={{
      //         width: getResponsiveWidth(26),
      //         height: getResponsiveHeight(26),
      //         resizeMode: 'contain',
      //       }}
      //     />
      //   </TouchableOpacity>
      // ),
    });
  }, [navigation, selectedCategory, selectedImagesFromRoute]);

  // 카테고리 목록 조회
  useEffect(() => {
    if (familyId) {
      console.log('📥 카테고리 목록 조회 요청, familyId:', familyId);
      dispatch(fetchCategoryThunk(familyId));
    } else {
      console.log('❌ familyId 없음, 카테고리 조회 스킵');
    }
  }, [dispatch, familyId]);

  // 첫 진입 시 기본 선택
  useEffect(() => {
    if (categoryList.length > 0) {
      console.log('✨ categoryList 첫 로딩/변경, 기본 첫 번째 카테고리 선택');
      console.log('✨ categoryList[0]:', categoryList[0]);
      setSelectedCategory(categoryList[0]);
      setSelectedIndex(0);
    } else {
      console.log('ℹ️ categoryList 비어 있음');
    }
  }, [categoryList]);

  const handleAddCategory = () => {
    console.log('➕ 새 카테고리 추가 버튼 클릭, 입력값:', newCategory);

    if (newCategory.trim()) {
      const generatedId = String(uuid.v4());

      const tempCategory = {
        categoryId: generatedId, // ✅ 여기서 미리 UUID 부여
        title: newCategory.trim(),
        isTemporary: true,
      };
      const updated = [...categoryList, tempCategory];

      console.log('🆕 생성된 임시 카테고리(tempCategory):', tempCategory);
      console.log('🆕 업데이트된 카테고리 목록(updated):', updated);

      setNewCategory('');
      setAddModalVisible(false);
      setSelectedCategory(tempCategory);
      setSelectedIndex(updated.length - 1);

      dispatch({type: 'category/setTempCategoryList', payload: updated});
      console.log('📤 dispatch(category/setTempCategoryList) 완료');
    } else {
      console.log('❌ newCategory 공백, 생성 안 함');
    }
  };

  const renderItem = ({item, index}) => {
    const isSelected = selectedIndex === index;
    return (
      <TouchableOpacity
        onPress={() => {
          console.log('✅ 카테고리 셀 클릭:', {item, index});
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
              onPress={() => {
                console.log('📥 카테고리 추가 모달 오픈');
                setAddModalVisible(true);
              }}>
              <Text style={styles.addText}>카테고리 추가</Text>
            </TouchableOpacity>
            <View style={styles.separator} />
          </>
        }
      />

      <CategoryModal
        visible={addModalVisible}
        onClose={() => {
          console.log('🧹 카테고리 추가 모달 닫기');
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
                placeholderTextColor={EMPTY_STYLE.emptyColor}
                style={styles.input}
                value={newCategory}
                onChangeText={text => {
                  setNewCategory(text);
                }}
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
    fontSize: HEADER_STYLES.defaultTitleFontSize,
    fontFamily: HEADER_STYLES.defaultTitleFontFamily,
    color: HEADER_STYLES.defaultTitleFontColor,
    lineHeight: getResponsiveHeight(26),
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  headerRight: {
    marginRight: getResponsiveWidth(10),
  },
  checkImage: {
    width: HEADER_STYLES.headerRightIconWidth,
    height: HEADER_STYLES.headerRightIconHeight,
    marginRight: HEADER_STYLES.headerRightIconRightPadding,
    resizeMode: 'contain',
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: getResponsiveWidth(18),
    paddingHorizontal: getResponsiveWidth(22),
  },
  selectedItem: {
    backgroundColor: '#FFF3D2',
  },
  itemText: {
    fontSize: getResponsiveFontSize(14.5),
    fontFamily: 'Pretendard-Regular',
    color: 'black',
    textAlignVertical: 'center',
  },
  radioIcon: {
    width: getResponsiveWidth(14),
    height: getResponsiveHeight(14),
    resizeMode: 'contain',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginHorizontal: getResponsiveWidth(5),
  },
  addButton: {
    paddingVertical: getResponsiveWidth(18),
    paddingHorizontal: getResponsiveWidth(22),
  },
  addText: {
    color: '#F8B500',
    fontSize: getResponsiveFontSize(14.5),
    fontFamily: 'Pretendard-Medium',
  },
  modalContent: {
    paddingHorizontal: getResponsiveWidth(10),
  },
  modalTitle: {
    color: 'black',
    fontSize:
      Platform.OS === 'android'
        ? getResponsiveFontSize(17)
        : getResponsiveFontSize(18),
    fontFamily: 'Pretendard-SemiBold',
    textAlign: 'center',
    marginBottom: getResponsiveHeight(12),
    marginTop: getResponsiveHeight(12),
  },
  inputBox: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: getResponsiveWidth(10),
    paddingVertical:
      Platform.OS === 'ios' ? getResponsiveHeight(10) : getResponsiveHeight(4),
  },
  input: {
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(14.5),
  },
});
