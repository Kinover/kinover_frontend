/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable no-alert */
/* eslint-disable react-native/no-inline-styles */
import React, {useState, useLayoutEffect, useEffect, useMemo} from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import CustomInput from 'components/CustomInput';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import AppText from 'components/AppText';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from 'utils/responsive';
import CategoryModal from '../components/modals/CategoryModal';
import {
  useCreateCategoryMutation,
  useGetCategoriesQuery,
} from '../services/memoryApi';
import {EMPTY_STYLE} from 'styles/style';
import {FONTS} from 'styles/typography';

function CategoryHeaderTitle() {
  return (
    <View style={{width: '100%', alignItems: 'center'}}>
      <AppText style={{fontSize: getResponsiveFontSize(20)}}>카테고리 선택</AppText>
    </View>
  );
}

function CategoryHeaderRight({onPress}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{marginRight: getResponsiveWidth(10)}}>
      <Image
        source={require('../../../assets/images/check-bt.png')}
        style={{width: 25, height: 25, resizeMode: 'contain'}}
      />
    </TouchableOpacity>
  );
}

export default function CategoryPage() {
  const styles = useScaledStyleSheet(rf => ({

  container: {
    flex: 1,
    backgroundColor: 'white',
    borderTopWidth: 3,
    borderColor: '#D3D3D3',
  },
  itemContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: getResponsiveWidth(20),
    paddingHorizontal: getResponsiveWidth(25),
  },
  selectedItem: {
    backgroundColor: '#FFF3D2',
  },
  itemText: {
    fontSize: rf(15),
    fontFamily: FONTS.REGULAR,
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginHorizontal: getResponsiveWidth(10),
  },

  }));
  const navigation = useNavigation();
  const fallbackCategoryList = useSelector(state => state.category?.categoryList || []);
  const {
    data: categoryQueryData = [],
    refetch: refetchCategories,
  } = useGetCategoriesQuery();
  const [createCategory] = useCreateCategoryMutation();
  const categoryList =
    Array.isArray(categoryQueryData) && categoryQueryData.length > 0
      ? categoryQueryData
      : fallbackCategoryList;

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [isCategoryInputFocused, setIsCategoryInputFocused] = useState(false);

  const fullCategoryList = useMemo(() => {
    const 전체 = {categoryId: 'all', title: '전체'};
    return [전체, ...categoryList];
  }, [categoryList]);

  useEffect(() => {
    if (fullCategoryList.length > 0) {
      setSelectedCategory(fullCategoryList[0]);
      setSelectedIndex(0);
    }
  }, [fullCategoryList]);

  const handleAddCategory = async () => {
    if (newCategory.trim()) {
      try {
        await createCategory({title: newCategory.trim()}).unwrap();
        await refetchCategories();
        setNewCategory('');
        setAddModalVisible(false);
      } catch {
        alert('카테고리 생성 실패');
      }
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: <CategoryHeaderTitle />,
      headerRight: <CategoryHeaderRight />,
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
        style={[
          styles.itemContainer,
          selectedIndex === index && styles.selectedItem,
        ]}>
        <AppText style={styles.itemText}>{item.title}</AppText>
        <TouchableOpacity>
          <Image
            source={
              isSelected
                ? require('../../../assets/images/selected-bt.png')
                : require('../../../assets/images/unselected-bt.png')
            }
            style={{
              width: getResponsiveWidth(14),
              height: getResponsiveHeight(14),
              resizeMode: 'contain',
            }}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={fullCategoryList}
        renderItem={renderItem}
        keyExtractor={(item, index) => item.categoryId + index}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      <CategoryModal
        visible={addModalVisible}
        onClose={() => {
          setNewCategory('');
          setIsCategoryInputFocused(false);
          setAddModalVisible(false);
        }}
        onConfirm={handleAddCategory}
        confirmDisabled={newCategory.trim().length === 0}
        content={
          <View>
            <AppText
              style={{
                fontSize: getResponsiveFontSize(18),
                fontFamily: FONTS.SEMI_BOLD,
                textAlign: 'center',
                marginVertical: getResponsiveHeight(15),
              }}>
              새 카테고리를 입력해주세요
            </AppText>
            <View
              style={{
                borderWidth: 1,
                borderColor: isCategoryInputFocused ? '#FFC84D' : '#E5E7EB',
                borderRadius: 10,
                backgroundColor: '#F5F5F5',
                paddingHorizontal: 12,
                paddingVertical: 2,
              }}>
              <CustomInput
                disableBaseStyle={true}
                disableFocusStyle={true}
                placeholder="예: 2025 가족 여행"
                placeholderTextColor={EMPTY_STYLE().emptyColor}
                style={{
                  fontFamily: FONTS.REGULAR,
                  fontSize: getResponsiveFontSize(14),
                  borderWidth: 0,
                  backgroundColor: 'transparent',
                }}
                value={newCategory}
                onChangeText={setNewCategory}
                onFocus={() => setIsCategoryInputFocused(true)}
                onBlur={() => setIsCategoryInputFocused(false)}
              />
            </View>
          </View>
        }
      />
    </View>
  );
}

