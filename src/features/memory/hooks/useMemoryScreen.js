// src/hooks/memory/useMemoryScreen.js

import {useState, useRef, useMemo, useCallback} from 'react';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';

export const useMemoryScreen = () => {
  const navigation = useNavigation();
  const categorySheetRef = useRef(null);

  // ✅ null-safe
  const categoryList = useSelector(state => state.category?.categoryList || []);

  const [selectedTab, setSelectedTab] = useState('feed');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const selectedCategoryTitle = useMemo(
    () => selectedCategory?.title || '전체',
    [selectedCategory],
  );

  const openCategorySheet = useCallback(() => {
    categorySheetRef.current?.present?.();
  }, []);

  const handleSelectCategory = useCallback(category => {
    setSelectedCategory(category);
  }, []);

  const navigateToImageSelect = useCallback(() => {
    navigation.navigate('이미지선택화면');
  }, [navigation]);

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
