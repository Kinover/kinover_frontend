/* eslint-disable react-native/no-inline-styles */
// src/screens/memory/MemoryScreen.js
import React, {useMemo, useState, useRef, useCallback, useEffect} from 'react';
import {View, StyleSheet, TouchableOpacity, Image} from 'react-native';

import MemoryFeed from './MemoryFeedScreen';
import AnimatedAlbumTabSelector from '../components/AlbumTabSelector';
import CategoryBottomSheetModal from '../components/CategoryBottomSheet';

import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveIconSize,
  getResponsiveFontSize,
} from '../../../utils/responsive';

import {useMemoryScreen} from '../hooks/useMemoryScreen';
import PeriodFilterModal from '../components/PeriodFilterModal';

// ✅ 탭바 숨김 제어 훅
import {useTabBarVisibility} from 'app/navigation/animatedTabBar';

// ✅ Redux 탭을 단일 소스로
import {useDispatch, useSelector} from 'react-redux';
import {setMemorySelectedTab} from '../store/memorySlice';

export default function MemoryScreen() {
  const dispatch = useDispatch();

  // ✅ 탭: Redux에서 가져오기 (단일 소스)
  const selectedTab = useSelector(state => state.memory.ui.selectedTab);
  const onSelectTab = useCallback(
    tab => dispatch(setMemorySelectedTab(tab)),
    [dispatch],
  );

  const {
    selectedCategory,
    selectedCategoryTitle,
    categoryList,
    categorySheetRef,
    handleSelectCategory,
    navigateToImageSelect,
  } = useMemoryScreen();

  // 🔹 기간 필터 상태
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // ✅ 탭바 숨김 sharedValue
  const {tabBarTranslateY} = useTabBarVisibility();

  // ✅ 스크롤 방향 감지용 ref
  const lastYRef = useRef(0);
  const lastToggleTsRef = useRef(0);

  // 'YYYY-MM-DD' → 'YYYY.MM.DD'로 보여주기
  const periodLabel = useMemo(() => {
    if (!startDate || !endDate) return null;
    const formatDot = s => s.replace(/-/g, '.');
    return `${formatDot(startDate)} ~ ${formatDot(endDate)}`;
  }, [startDate, endDate]);

  const handleApplyPeriod = ({startDate: s, endDate: e}) => {
    setStartDate(s || '');
    setEndDate(e || '');
    setIsFilterVisible(false);
  };

  // ✅ 탭바 보이기/숨기기 함수
  const showTabBar = useCallback(() => {
    tabBarTranslateY.value = 0;
  }, [tabBarTranslateY]);

  const hideTabBar = useCallback(() => {
    tabBarTranslateY.value = 1;
  }, [tabBarTranslateY]);

  // ✅ MemoryFeed에서 올라오는 스크롤 이벤트로 탭바 제어
  const handleFeedScroll = useCallback(
    e => {
      const y = e?.nativeEvent?.contentOffset?.y ?? 0;

      // ✅ 1) 맨 위 도달하면 무조건 탭바 보이기 (게시글/앨범 공통)
      // iOS에서 bounce로 -값이 나올 수 있어서 <= 0 허용
      // 살짝 여유 주고 싶으면 2~4 정도로 올려도 됨
      const TOP_Y = 0;
      if (y <= TOP_Y) {
        lastYRef.current = y;
        // 쿨타임 무시하고 확실하게 보여주기
        lastToggleTsRef.current = Date.now();
        showTabBar();
        return;
      }

      const dy = y - lastYRef.current;
      lastYRef.current = y;

      const now = Date.now();
      const coolTime = 120;
      if (now - lastToggleTsRef.current < coolTime) return;

      const THRESHOLD = 8;

      // 아래로 내리면 숨김(콘텐츠 더 보이게)
      if (dy > THRESHOLD) {
        lastToggleTsRef.current = now;
        hideTabBar();
        return;
      }

      // 위로 올리면 표시
      if (dy < -THRESHOLD) {
        lastToggleTsRef.current = now;
        showTabBar();
      }
    },
    [hideTabBar, showTabBar],
  );

  // ✅ 화면 나갈 때 탭바 복구
  useEffect(() => {
    return () => {
      tabBarTranslateY.value = 0;
    };
  }, [tabBarTranslateY]);

  return (
    <View style={styles.container}>
      <AnimatedAlbumTabSelector
        selected={selectedTab}
        onSelect={onSelectTab}
        onPressDateFilter={() => setIsFilterVisible(true)}
        periodLabel={periodLabel}
      />

      <MemoryFeed
        selectedCategoryTitle={selectedCategoryTitle}
        startDate={startDate}
        endDate={endDate}
        onScroll={handleFeedScroll}
      />

      <CategoryBottomSheetModal
        ref={categorySheetRef}
        categoryList={categoryList}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        onCancel={() => {}}
      />

      <TouchableOpacity
        style={{
          position: 'absolute',
          bottom: getResponsiveHeight(110),
          right: getResponsiveWidth(18),
          width: getResponsiveIconSize(60),
          height: getResponsiveIconSize(60),
        }}
        onPress={navigateToImageSelect}>
        <Image
          source={require('../../../assets/icons/posting-floating-bt.png')}
          style={{width: '100%', height: '100%', objectFit: 'contain'}}
        />
      </TouchableOpacity>

      <PeriodFilterModal
        visible={isFilterVisible}
        onClose={() => setIsFilterVisible(false)}
        onApply={handleApplyPeriod}
        initialStartDate={startDate}
        initialWeeks={1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9F9F9', width: '100%'},
  rangeBar: {
    paddingHorizontal: getResponsiveWidth(24),
    paddingBottom: getResponsiveHeight(4),
  },
  rangeText: {fontSize: getResponsiveFontSize(12), color: '#777'},
});
