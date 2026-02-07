// src/hooks/memory/useMemoryScreen.js
import {useState, useRef, useMemo, useCallback} from 'react';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';

// ✅ id 키 통일: id 우선, 없으면 categoryId 사용
const getCatId = cat => {
  const v = cat?.id ?? cat?.categoryId ?? null;
  return v != null ? String(v) : null;
};

// ✅ 선택/저장 시 항상 {id, title, ...} 형태로 정규화
const normalizeCategory = cat => {
  if (!cat) return null;

  // "전체" 같은 커스텀 객체는 이미 id를 가질 확률 높음
  const id = getCatId(cat);
  const title = cat?.title ?? '전체';

  return {
    ...cat,
    id: id != null ? id : cat?.id, // id를 강제로 심어줌(문자열)
    title,
  };
};

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

  // ✅ 같은 카테고리 다시 선택하면 state 업데이트 막기
  // ✅ (중요) id / categoryId 둘 다 지원
  const handleSelectCategory = useCallback(category => {
    const next = normalizeCategory(category);

    setSelectedCategory(prevRaw => {
      const prev = normalizeCategory(prevRaw);

      const prevId = getCatId(prev);
      const nextId = getCatId(next);

      // ✅ 둘 다 null이면(진짜로 아무것도 없는 경우) 그대로
      if (!prevId && !nextId) return prevRaw;

      // ✅ id 기준 동일하면 그대로(리렌더 방지)
      if (prevId && nextId && prevId === nextId) return prevRaw;

      // ✅ id가 없을 수 있는 특이 케이스(예: title-only) fallback
      const prevTitle = prev?.title ?? '';
      const nextTitle = next?.title ?? '';
      if (!prevId && !nextId && prevTitle === nextTitle) return prevRaw;

      return next;
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
