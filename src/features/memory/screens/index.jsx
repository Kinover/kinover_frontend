/* eslint-disable react-native/no-inline-styles */
// src/screens/memory/MemoryScreen.js
import React, {useMemo, useState, useRef, useCallback, useEffect} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';

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

// ✅ HAPTIC
import {hapticLight} from '../../../utils/haptic';

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

  // =========================
  // ✅ 상단 탭셀렉터 숨김 애니메이션
  // =========================
  const headerHeightRef = useRef(0);
  const headerProgress = useRef(new Animated.Value(0)).current; // 0: 보임, 1: 숨김
  const headerHiddenRef = useRef(false);

  const showHeader = useCallback(() => {
    if (!headerHiddenRef.current) return;
    headerHiddenRef.current = false;

    Animated.timing(headerProgress, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false, // height 때문에 false
    }).start();
  }, [headerProgress]);

  const hideHeader = useCallback(() => {
    if (headerHiddenRef.current) return;
    headerHiddenRef.current = true;

    Animated.timing(headerProgress, {
      toValue: 1,
      duration: 180,
      useNativeDriver: false, // height 때문에 false
    }).start();
  }, [headerProgress]);

  const onHeaderLayout = useCallback(e => {
    const h = e?.nativeEvent?.layout?.height ?? 0;
    if (h > 0) headerHeightRef.current = h;
  }, []);

  // ✅ period label
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

  // ✅ MemoryFeed에서 올라오는 스크롤 이벤트로 탭바 + 상단 탭셀렉터 제어
  const handleFeedScroll = useCallback(
    e => {
      const y = e?.nativeEvent?.contentOffset?.y ?? 0;

      // ✅ 맨 위 도달하면 탭바/헤더 무조건 보이기
      const TOP_Y = 0;
      if (y <= TOP_Y) {
        lastYRef.current = y;
        lastToggleTsRef.current = Date.now();
        showTabBar();
        showHeader();
        return;
      }

      const dy = y - lastYRef.current;
      lastYRef.current = y;

      const now = Date.now();
      const coolTime = 120;
      if (now - lastToggleTsRef.current < coolTime) return;

      const THRESHOLD = 8;

      // 아래로 스크롤: 탭바 숨김 + 헤더 숨김
      if (dy > THRESHOLD) {
        lastToggleTsRef.current = now;
        hideTabBar();
        hideHeader();
        return;
      }

      // 위로 스크롤: 탭바 보이기 + 헤더 보이기
      if (dy < -THRESHOLD) {
        lastToggleTsRef.current = now;
        showTabBar();
        showHeader();
      }
    },
    [hideTabBar, showTabBar, hideHeader, showHeader],
  );

  // ✅ 화면 나갈 때 탭바/헤더 복구
  useEffect(() => {
    return () => {
      tabBarTranslateY.value = 0;
      headerHiddenRef.current = false;
      headerProgress.setValue(0);
    };
  }, [tabBarTranslateY, headerProgress]);

  // ✅ 하단 플로팅 버튼 핸들러 (햅틱 포함)
  const handleFabPress = useCallback(() => {
    hapticLight();
    navigateToImageSelect?.();
  }, [navigateToImageSelect]);

  // ✅ 헤더 애니메이션 스타일(공간까지 접기)
  const headerHeight = headerHeightRef.current || getResponsiveHeight(70);
  const headerAnimatedStyle = {
    height: headerProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [headerHeight, 0],
    }),
    opacity: headerProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
    }),
    transform: [
      {
        translateY: headerProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -headerHeight],
        }),
      },
    ],
    overflow: 'hidden',
  };

  return (
    <View style={styles.container}>
      {/* ✅ 스크롤 내리면 같이 접히는 상단 탭셀렉터 */}
      <Animated.View onLayout={onHeaderLayout} style={headerAnimatedStyle}>
        <AnimatedAlbumTabSelector
          selected={selectedTab}
          onSelect={onSelectTab}
          onPressDateFilter={() => setIsFilterVisible(true)}
          periodLabel={periodLabel}
        />
      </Animated.View>

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
        style={styles.fab}
        onPress={handleFabPress}
        activeOpacity={0.85}>
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

  fab: {
    position: 'absolute',
    bottom: getResponsiveHeight(110),
    right: getResponsiveWidth(18),
    width: getResponsiveIconSize(60),
    height: getResponsiveIconSize(60),
  },
});
