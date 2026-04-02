// src/hooks/memory/useMemoryScreen.js
import {useState, useRef, useMemo, useCallback} from 'react';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {useGetCategoriesQuery} from '../services/memoryApi';

// id 키 통일: id 우선, 없으면 categoryId 사용
const getCatId = cat => {
  const v = cat?.id ?? cat?.categoryId ?? null;
  return v != null ? String(v) : null;
};

export const useMemoryScreen = () => {
  const navigation = useNavigation();
  const categorySheetRef = useRef(null);

  const fallbackCategoryList = useSelector(state => state.category?.categoryList || []);
  const {data: categoryQueryData} = useGetCategoriesQuery();
  const categoryList = Array.isArray(categoryQueryData)
    ? categoryQueryData
    : fallbackCategoryList;

  const [selectedTab, setSelectedTab] = useState('feed');
  /** null = 전체(필터 없음), 배열 = 선택한 카테고리 id 목록(복수 가능) */
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(null);

  const selectedCategoryTitle = useMemo(() => {
    if (selectedCategoryIds == null || selectedCategoryIds.length === 0) {
      return '전체';
    }
    if (selectedCategoryIds.length === 1) {
      const found = categoryList.find(
        c => getCatId(c) === String(selectedCategoryIds[0]),
      );
      return found?.title ?? '전체';
    }
    return `${selectedCategoryIds.length}개`;
  }, [selectedCategoryIds, categoryList]);

  const openCategorySheet = useCallback(() => {
    categorySheetRef.current?.present?.();
  }, []);

  /** @param {null | string[]} ids null이면 전체 */
  const handleSelectCategory = useCallback(ids => {
    if (ids == null || (Array.isArray(ids) && ids.length === 0)) {
      setSelectedCategoryIds(null);
      return;
    }
    setSelectedCategoryIds(ids.map(String));
  }, []);

  const navigateToImageSelect = useCallback(() => {
    navigation.navigate('이미지선택화면');
  }, [navigation]);

  return {
    selectedTab,
    setSelectedTab,
    selectedCategoryIds,
    selectedCategoryTitle,

    categoryList,

    categorySheetRef,
    openCategorySheet,
    handleSelectCategory,

    navigateToImageSelect,
  };
};
