/* eslint-disable react-native/no-inline-styles */
// src/screens/memory/MemoryScreen.js

import React, {useMemo, useState, useRef, useCallback, useEffect} from 'react';
import {View, StyleSheet, TouchableOpacity, Animated, Image} from 'react-native';

import MemoryFeed from './MemoryFeedScreen';
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
import {BACKGROUND_COLORS} from 'styles/style';
import FastImage from '@d11/react-native-fast-image'; // ✅ ScheduleScreen과 동일

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
  const FAB_RIGHT = getResponsiveWidth(13);
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

  const handleApplyPeriod = useCallback(
    ({startDate: s, endDate: e}) => {
      setStartDate(s || '');
      setEndDate(e || '');
      setIsFilterVisible(false);

      requestAnimationFrame(() => forceShowHeaderAndTabBar(true));
    },
    [forceShowHeaderAndTabBar],
  );

  const onSelectTab = useCallback(
    tab => {
      dispatch(setMemorySelectedTab(tab));
      requestAnimationFrame(() => forceShowHeaderAndTabBar(true));
    },
    [dispatch, forceShowHeaderAndTabBar],
  );

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

  const openCategorySheet = useCallback(() => {
    categorySheetRef?.current?.present?.();
  }, [categorySheetRef]);

  const openPeriodModal = useCallback(() => {
    setIsFilterVisible(true);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={headerAnimatedStyle}>
        <View onLayout={onHeaderContentLayout}>
          <AnimatedAlbumTabSelector
            selected={selectedTab}
            onSelect={onSelectTab}
          />
        </View>
      </Animated.View>

      <MemoryFeed
        selectedCategoryTitle={selectedCategoryTitle}
        startDate={startDate}
        endDate={endDate}
        onScroll={handleFeedScroll}
        onPressCategoryFilter={openCategorySheet}
        onPressPeriodFilter={openPeriodModal}
      />

      <CategoryBottomSheetModal
        ref={categorySheetRef}
        categoryList={categoryList}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategoryWithReset}
        onCancel={() => {}}
      />

      {/* ✅ FAB: ScheduleScreen과 동일한 DropShadow + TouchableOpacity + FastImage */}
      <AnimatedRe.View
        pointerEvents={fabHidden ? 'none' : 'auto'}
        style={[
          styles.fabWrap, // ✅ 위치/크기만 담당
          {right: FAB_RIGHT, bottom: FAB_BOTTOM},
          fabAnimatedStyle,
        ]}>
        <DropShadow style={styles.fabShadow}>
          <TouchableOpacity
            style={styles.fab}
            onPress={handleFabPress}
            activeOpacity={0.8}>
            <Image
              source={require('../../../assets/icons/tabs/4/four.png')}
              style={styles.fabIcon}
              tintColor={'white'}
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
  container: {
    flex: 1,
    backgroundColor: BACKGROUND_COLORS.secondaryBg,
    width: '100%',
  },
  rangeBar: {
    paddingHorizontal: getResponsiveWidth(24),
    paddingBottom: getResponsiveHeight(4),
  },
  rangeText: {fontSize: getResponsiveFontSize(12), color: '#777'},

  // ✅ FAB wrapper: 애니메이션/포인터 이벤트용 컨테이너
  fabWrap: {
    position: 'absolute',
    zIndex: 99,
    width: getResponsiveIconSize(65),
    height: getResponsiveIconSize(65),
  },

  // ✅ DropShadow: ScheduleScreen과 동일
  fabShadow: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },

  // ✅ 버튼: ScheduleScreen과 동일
  fab: {
    width: getResponsiveIconSize(65),
    height: getResponsiveIconSize(65),
    backgroundColor: BACKGROUND_COLORS.primaryBg,
    borderRadius: 999,
    justifyContent: 'center',
  },

  // ✅ 아이콘: ScheduleScreen과 동일 (50% + contain)
  fabIcon: {
    alignSelf: 'center',
    width: '45%',
    height: '45%',
    resizeMode: 'contain',
  },
});
