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

import MemoryFeed from './MemoryFeedScreen'; // ✅ 너 프로젝트 경로 그대로 유지
import AnimatedAlbumTabSelector from '../components/AlbumTabSelector';
import CategoryBottomSheetModal from '../components/CategoryBottomSheet';
import PeriodFilterModal from '../components/PeriodFilterModal';

import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveIconSize,
  getResponsiveFontSize,
} from '../../../utils/responsive';

import {useMemoryScreen} from '../hooks/useMemoryScreen';
import {useTabBarVisibility} from 'app/navigation/animatedTabBar';

import {useDispatch, useSelector} from 'react-redux';
import {setMemorySelectedTab} from '../store/memorySlice';

import {hapticLight} from '../../../utils/haptic';
import {useFocusEffect} from '@react-navigation/native';

import AnimatedRe, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import DropShadow from 'react-native-drop-shadow';
import MagazineBanner from '../components/MagazineBanner';

export default function MemoryScreen() {
  const dispatch = useDispatch();

  const selectedTab = useSelector(state => state.memory.ui.selectedTab);

  const {
    selectedCategory,
    selectedCategoryTitle,
    categoryList,
    categorySheetRef,
    handleSelectCategory,
    navigateToImageSelect,
  } = useMemoryScreen();

  // ✅ 기간 필터(기존 그대로 유지: PostFilterBar에서 열게만 바꿈)
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const {tabBarTranslateY} = useTabBarVisibility();

  // =========================
  // ✅ 상단 탭셀렉터 숨김 애니메이션 (RN Animated)
  // =========================
  const lastYRef = useRef(0);
  const lastToggleTsRef = useRef(0);

  const [headerHeight, setHeaderHeight] = useState(getResponsiveHeight(50));
  const headerHeightRef = useRef(headerHeight);
  useEffect(() => {
    headerHeightRef.current = headerHeight;
  }, [headerHeight]);

  const headerProgress = useRef(new Animated.Value(0)).current; // 0: 보임, 1: 숨김

  const showHeader = useCallback(() => {
    headerProgress.stopAnimation(cur => {
      if (cur <= 0.001) return;
      Animated.timing(headerProgress, {
        toValue: 0,
        duration: 180,
        useNativeDriver: false,
      }).start();
    });
  }, [headerProgress]);

  const hideHeader = useCallback(() => {
    headerProgress.stopAnimation(cur => {
      if (cur >= 0.999) return;
      Animated.timing(headerProgress, {
        toValue: 1,
        duration: 180,
        useNativeDriver: false,
      }).start();
    });
  }, [headerProgress]);

  const onHeaderContentLayout = useCallback(e => {
    const h = e?.nativeEvent?.layout?.height ?? 0;
    if (h <= 0) return;

    setHeaderHeight(prev => {
      const next = Math.max(prev || 0, h);
      return Math.abs(next - prev) > 0.5 ? next : prev;
    });
  }, []);

  // ✅ periodLabel은 PostFilterBar에서 쓸 거라 MemoryFeed로 내려주면 됨
  const periodLabel = useMemo(() => {
    if (!startDate || !endDate) return null;
    const formatDot = s => s.replace(/-/g, '.');
    return `${formatDot(startDate)} ~ ${formatDot(endDate)}`;
  }, [startDate, endDate]);

  const showTabBar = useCallback(() => {
    tabBarTranslateY.value = 0;
  }, [tabBarTranslateY]);

  const hideTabBar = useCallback(() => {
    tabBarTranslateY.value = 1;
  }, [tabBarTranslateY]);

  // =========================
  // ✅ FAB도 탭바랑 "동시에" 숨김/등장
  // =========================
  const FAB_SIZE = getResponsiveIconSize(65);
  const FAB_RIGHT = getResponsiveWidth(14);
  const FAB_BOTTOM = getResponsiveHeight(110);

  const TABBAR_H = getResponsiveHeight(92);
  const FAB_HIDE_EXTRA = getResponsiveHeight(14);
  const FAB_HIDE_DISTANCE = TABBAR_H + FAB_HIDE_EXTRA;

  const [fabHidden, setFabHidden] = useState(false);

  const showTabBarWithFab = useCallback(() => {
    setFabHidden(false);
    showTabBar();
  }, [showTabBar]);

  const hideTabBarWithFab = useCallback(() => {
    setFabHidden(true);
    hideTabBar();
  }, [hideTabBar]);

  const forceShowHeaderAndTabBar = useCallback(
    (withUnreadFetch = false) => {
      showTabBarWithFab();

      headerProgress.stopAnimation?.();
      headerProgress.setValue(0);

      lastYRef.current = 0;
      lastToggleTsRef.current = 0;
    },
    [showTabBarWithFab, headerProgress, dispatch],
  );

  useFocusEffect(
    useCallback(() => {
      requestAnimationFrame(() => {
        forceShowHeaderAndTabBar(false);
        showHeader();
        showTabBarWithFab();
      });
      return () => {};
    }, [forceShowHeaderAndTabBar, showHeader, showTabBarWithFab]),
  );

  const handleFeedScroll = useCallback(
    e => {
      const y = e?.nativeEvent?.contentOffset?.y ?? 0;

      if (y <= 0) {
        lastYRef.current = y;
        lastToggleTsRef.current = Date.now();
        showTabBarWithFab();
        showHeader();
        return;
      }

      const dy = y - lastYRef.current;
      lastYRef.current = y;

      const now = Date.now();
      const coolTime = 120;
      if (now - lastToggleTsRef.current < coolTime) return;

      const THRESHOLD = 8;

      if (dy > THRESHOLD) {
        lastToggleTsRef.current = now;
        hideTabBarWithFab();
        hideHeader();
        return;
      }

      if (dy < -THRESHOLD) {
        lastToggleTsRef.current = now;
        showTabBarWithFab();
        showHeader();
      }
    },
    [hideHeader, showHeader, hideTabBarWithFab, showTabBarWithFab],
  );

  // ✅ 기간 필터 적용
  const handleApplyPeriod = useCallback(
    ({startDate: s, endDate: e}) => {
      setStartDate(s || '');
      setEndDate(e || '');
      setIsFilterVisible(false);

      requestAnimationFrame(() => forceShowHeaderAndTabBar(true));
    },
    [forceShowHeaderAndTabBar],
  );

  // ✅ 탭 변경
  const onSelectTab = useCallback(
    tab => {
      dispatch(setMemorySelectedTab(tab));
      requestAnimationFrame(() => forceShowHeaderAndTabBar(true));
    },
    [dispatch, forceShowHeaderAndTabBar],
  );

  // ✅ 카테고리 선택
  const handleSelectCategoryWithReset = useCallback(
    cat => {
      handleSelectCategory?.(cat);

      // ✅ 카테고리 선택하면 기간도 초기화하고 싶으면 아래 주석 해제
      // setStartDate('');
      // setEndDate('');

      requestAnimationFrame(() => forceShowHeaderAndTabBar(true));
    },
    [handleSelectCategory, forceShowHeaderAndTabBar],
  );

  useEffect(() => {
    return () => {
      tabBarTranslateY.value = 0;
      headerProgress.setValue(0);

      lastYRef.current = 0;
      lastToggleTsRef.current = 0;

      setFabHidden(false);
    };
  }, [tabBarTranslateY, headerProgress]);

  const handleFabPress = useCallback(() => {
    hapticLight();
    navigateToImageSelect?.();
  }, [navigateToImageSelect]);

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

  const fabAnimatedStyle = useAnimatedStyle(() => {
    const v = tabBarTranslateY.value;
    return {
      transform: [
        {translateY: withTiming(v * FAB_HIDE_DISTANCE, {duration: 180})},
        {scale: withTiming(v ? 0.92 : 1, {duration: 180})},
      ],
      opacity: withTiming(v ? 0 : 1, {duration: 180}),
    };
  }, [FAB_HIDE_DISTANCE, tabBarTranslateY]);

  // ✅ PostFilterBar에서 카테고리/기간 버튼 누르면 여기서 열어줌
  const openCategorySheet = useCallback(() => {
    categorySheetRef?.current?.present?.();
  }, [categorySheetRef]);

  const openPeriodModal = useCallback(() => {
    setIsFilterVisible(true);
  }, []);

  return (
    <View style={styles.container}>
      {/* ✅ 헤더에는 이제 "탭(게시글/앨범)"만 남김
          - 기간선택 버튼 제거: AnimatedAlbumTabSelector 내부에서 onPressDateFilter 안 씀 */}
      <Animated.View style={headerAnimatedStyle}>
        <View onLayout={onHeaderContentLayout}>
          <AnimatedAlbumTabSelector
            selected={selectedTab}
            onSelect={onSelectTab}
            // ✅ 기간선택 UI를 헤더에서 제거할 거라서 전달 X(또는 noop)
            // onPressDateFilter={() => {}}
            // periodLabel={null}
          />
          <MagazineBanner />
        </View>
      </Animated.View>

      {/* ✅ PostFilterBar의 카테고리/기간 버튼을 활성화하려면
          MemoryFeed로 핸들러와 기간값을 내려줘야 함 */}
      <MemoryFeed
        selectedCategoryTitle={selectedCategoryTitle}
        startDate={startDate}
        endDate={endDate}
        onScroll={handleFeedScroll}
        onPressCategoryFilter={openCategorySheet}
        onPressPeriodFilter={openPeriodModal}
        // ✅ (선택) PostFilterBar가 periodLabel을 직접 쓰는 구조면 필요 없지만
        // 지금 MemoryFeed가 headerPeriodLabel 만들 때 start/end를 쓰고 있어서 OK
      />

      <CategoryBottomSheetModal
        ref={categorySheetRef}
        categoryList={categoryList}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategoryWithReset}
        onCancel={() => {}}
      />

      <AnimatedRe.View
        pointerEvents={fabHidden ? 'none' : 'auto'}
        style={[
          styles.fabWrap,
          {
            right: FAB_RIGHT,
            bottom: FAB_BOTTOM,
            width: FAB_SIZE,
            height: FAB_SIZE,
          },
          fabAnimatedStyle,
        ]}>
        <DropShadow
          style={{
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 5},
            shadowOpacity: 0.3,
            shadowRadius: 2,
          }}>
          <TouchableOpacity
            style={{width: '100%', height: '100%'}}
            onPress={handleFabPress}
            activeOpacity={0.85}>
            <Image
              source={require('../../../assets/icons/posting-floating-bt.png')}
              style={{width: '100%', height: '100%', objectFit: 'contain'}}
            />
          </TouchableOpacity>
        </DropShadow>
      </AnimatedRe.View>

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
  fabWrap: {
    position: 'absolute',
    zIndex: 99,
  },
});
