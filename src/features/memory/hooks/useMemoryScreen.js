// src/hooks/memory/useMemoryScreen.js
import {useState, useRef, useMemo, useCallback} from 'react';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';

export const useMemoryScreen = () => {
  const navigation = useNavigation();
  const categorySheetRef = useRef(null);

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

  // ✅ 같은 카테고리 다시 선택하면 state 업데이트 자체를 막기
  const handleSelectCategory = useCallback(category => {
    setSelectedCategory(prev => {
      const prevId = prev?.id != null ? String(prev.id) : null;
      const nextId = category?.id != null ? String(category.id) : null;

      // 둘 다 null이면(전체/초기) 그대로
      if (!prevId && !nextId) return prev;

      // id 기준 동일하면 그대로(리렌더 방지)
      if (prevId && nextId && prevId === nextId) return prev;

      // 혹시 id가 없고 title만 있으면 title 비교로 fallback
      const prevTitle = prev?.title ?? '';
      const nextTitle = category?.title ?? '';
      if (!prevId && !nextId && prevTitle === nextTitle) return prev;

      return category;
    });
  }, []);

  const navigateToImageSelect = useCallback(() => {
    navigation.navigate('이미지선택화면');
  }, [navigation]);

  return {
    selectedTab,
    setSelectedTab,
    selectedCategory,
    selectedCategoryTitle,

    categoryList,

    categorySheetRef,
    openCategorySheet,
    handleSelectCategory,

    navigateToImageSelect,
  };
};
