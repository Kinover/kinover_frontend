// src/hooks/memory/useMemoryScreen.js
import React,{useState, useRef, useLayoutEffect, useMemo} from 'react';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';

import CategoryDropdownButton from '../components/CategoryDropdownButton';
export const useMemoryScreen = () => {
  const navigation = useNavigation();
  const categorySheetRef = useRef(null);

  const categoryList = useSelector(state => state.category.categoryList);

  const [selectedTab, setSelectedTab] = useState('album');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const selectedCategoryTitle = useMemo(
    () => selectedCategory?.title || '전체',
    [selectedCategory],
  );

  const openCategorySheet = () => {
    categorySheetRef.current?.present();
  };

  // 헤더 셋팅
  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <CategoryDropdownButton
          selectedTitle={selectedCategoryTitle}
          onPress={openCategorySheet}
        />
      ),
    });
  }, [navigation, selectedCategoryTitle]);

  const handleSelectCategory = category => {
    setSelectedCategory(category);
  };

  const navigateToImageSelect = () => {
    navigation.navigate('이미지선택화면');
  };

  return {
    // 상태
    selectedTab,
    setSelectedTab,
    selectedCategory,
    selectedCategoryTitle,

    // 카테고리 목록
    categoryList,

    // bottom sheet
    categorySheetRef,
    openCategorySheet,
    handleSelectCategory,

    // 네비게이션
    navigateToImageSelect,
  };
};
