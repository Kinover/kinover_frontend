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

import {useTabBarVisibility} from 'app/navigation/animatedTabBar';

import {useDispatch, useSelector} from 'react-redux';
import {setMemorySelectedTab} from '../store/memorySlice';

import {hapticLight} from '../../../utils/haptic';
import {useFocusEffect} from '@react-navigation/native';

import AnimatedRe, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

// ✅ 알림 빨간점(안읽음 여부) 갱신 thunk
import {fetchHasUnreadThunk} from '../../notification/store/notificationThunk';

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

  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const {tabBarTranslateY} = useTabBarVisibility();

  // =========================
  // ✅ 상단 탭셀렉터 숨김 애니메이션 (RN Animated)
  // =========================
  const lastYRef = useRef(0);
  const lastToggleTsRef = useRef(0);

  // ✅ “실제 헤더 높이”는 애니메이션 래퍼가 아니라 "내용물"에서 측정해야 함
  const [headerHeight, setHeaderHeight] = useState(getResponsiveHeight(70));
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

  // ✅ 측정은 “내용물 View”에 붙이기 + 0/작은 값 무시 + 최대값 유지
  const onHeaderContentLayout = useCallback(e => {
    const h = e?.nativeEvent?.layout?.height ?? 0;
    if (h <= 0) return;

    // 애니메이션 과정에서 찌그러진 값이 들어오면 무시하고, 최대값만 유지
    setHeaderHeight(prev => {
      const next = Math.max(prev || 0, h);
      return Math.abs(next - prev) > 0.5 ? next : prev;
    });
  }, []);

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
  const FAB_SIZE = getResponsiveIconSize(60);
  const FAB_RIGHT = getResponsiveWidth(18);
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

  // ✅ 공통: 화면 상태 리셋 + (선택) 알림 빨간점 갱신
  const forceShowHeaderAndTabBar = useCallback(
    (withUnreadFetch = false) => {
      showTabBarWithFab();

      headerProgress.stopAnimation?.();
      headerProgress.setValue(0);

      lastYRef.current = 0;
      lastToggleTsRef.current = 0;

      // ✅ "갱신 타이밍"에서만 빨간점 체크
      if (withUnreadFetch) {
        dispatch(fetchHasUnreadThunk());
      }
    },
    [showTabBarWithFab, headerProgress, dispatch],
  );

  useFocusEffect(
    useCallback(() => {
      requestAnimationFrame(() => {
        // ❌ 여기서는 호출하지 않음 (요청: 진입 시 말고 "갱신 때만")
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

  // ✅ 기간 필터 적용 = "데이터 갱신" 성격 → unread 체크 같이
  const handleApplyPeriod = useCallback(
    ({startDate: s, endDate: e}) => {
      setStartDate(s || '');
      setEndDate(e || '');
      setIsFilterVisible(false);

      requestAnimationFrame(() => forceShowHeaderAndTabBar(true));
    },
    [forceShowHeaderAndTabBar],
  );

  // ✅ 탭 변경 = "데이터 갱신" 성격 → unread 체크 같이
  const onSelectTab = useCallback(
    tab => {
      dispatch(setMemorySelectedTab(tab));
      requestAnimationFrame(() => forceShowHeaderAndTabBar(true));
    },
    [dispatch, forceShowHeaderAndTabBar],
  );

  // ✅ 카테고리 선택 = "데이터 갱신" 성격 → unread 체크 같이
  const handleSelectCategoryWithReset = useCallback(
    cat => {
      handleSelectCategory?.(cat);
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

  // ✅ 헤더 애니메이션 스타일
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

  return (
    <View style={styles.container}>
      {/* ✅ 애니메이션 래퍼(여기에 onLayout 달면 안 됨!) */}
      <Animated.View style={headerAnimatedStyle}>
        {/* ✅ 내용물에서 높이 측정 */}
        <View onLayout={onHeaderContentLayout}>
          <AnimatedAlbumTabSelector
            selected={selectedTab}
            onSelect={onSelectTab}
            onPressDateFilter={() => setIsFilterVisible(true)}
            periodLabel={periodLabel}
          />
        </View>
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
        <TouchableOpacity
          style={{width: '100%', height: '100%'}}
          onPress={handleFabPress}
          activeOpacity={0.85}>
          <Image
            source={require('../../../assets/icons/posting-floating-bt.png')}
            style={{width: '100%', height: '100%', objectFit: 'contain'}}
          />
        </TouchableOpacity>
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
