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

import useGuide from 'hooks/useGuide';
import GuideModal from 'components/GuideModal';
import PeriodFilterModal from '../components/PeriodFilterModal';

// ✅ 탭바 숨김 제어 훅
import {useTabBarVisibility} from 'app/navigation/animatedTabBar';

const MEMORY_GUIDE_STEPS = [
  {
    title: '게시글 / 앨범 보기',
    description:
      '‘게시글’ 탭에서는 가족의 추억이 게시글 리스트로 정리돼요. ‘앨범’ 탭에서는 모든 사진을 갤러리 형태로 한눈에 모아볼 수 있어요.',
  },
  {
    title: '카테고리로 정리하기',
    description:
      '왼쪽 상단의 카테고리를 눌러 원하는 주제의 추억을 깔끔하게 모아보세요.',
  },
  {
    title: '추억 업로드하기',
    description:
      '오른쪽 아래 동그란 버튼을 눌러 사진과 글을 추가하고 새로운 추억을 만들어보세요.',
  },
];

export default function MemoryScreen() {
  const {
    selectedTab,
    setSelectedTab,
    selectedCategory,
    selectedCategoryTitle,
    categoryList,
    categorySheetRef,
    handleSelectCategory,
    navigateToImageSelect,
  } = useMemoryScreen();

  const {
    isGuideVisible,
    guideStep,
    currentGuide,
    totalSteps,
    nextStep,
    skipGuide,
  } = useGuide('MEMORY_GUIDE_SHOWN_V1', MEMORY_GUIDE_STEPS, true);

  // 🔹 기간 필터 상태
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [startDate, setStartDate] = useState(''); // 'YYYY-MM-DD'
  const [endDate, setEndDate] = useState('');
  const [rangePreset, setRangePreset] = useState('ALL'); // 프리셋 이름 저장

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

      // 너무 민감하면 덜컥거려서, 약간의 임계값/쿨타임 줌
      const dy = y - lastYRef.current;
      lastYRef.current = y;

      const now = Date.now();
      const coolTime = 120; // ms
      if (now - lastToggleTsRef.current < coolTime) return;

      const THRESHOLD = 8; // px 이상 움직일 때만 반응

      // 컨텐츠가 위로 올라가는 방향(손가락 아래->위) => y 증가 => dy > 0 => 탭바 숨김
      if (dy > THRESHOLD) {
        lastToggleTsRef.current = now;
        hideTabBar();
        return;
      }

      // 컨텐츠가 내려오는 방향(손가락 위->아래) => y 감소 => dy < 0 => 탭바 보임
      if (dy < -THRESHOLD) {
        lastToggleTsRef.current = now;
        showTabBar();
      }
    },
    [hideTabBar, showTabBar],
  );

  // ✅ 화면 나갈 때 탭바 무조건 복구 (중요)
  useEffect(() => {
    return () => {
      tabBarTranslateY.value = 0;
    };
  }, [tabBarTranslateY]);

  return (
    <View style={styles.container}>
      <AnimatedAlbumTabSelector
        selected={selectedTab}
        onSelect={setSelectedTab}
        onPressDateFilter={() => setIsFilterVisible(true)}
        periodLabel={periodLabel}
      />

      <MemoryFeed
        selectedTab={selectedTab}
        selectedCategoryTitle={selectedCategoryTitle}
        startDate={startDate}
        endDate={endDate}
        // ✅ 추가: 스크롤 이벤트 전달
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

      {/* 인앱 가이드 모달 */}
      {/* {currentGuide && (
        <GuideModal
          visible={isGuideVisible}
          step={guideStep}
          totalSteps={totalSteps}
          title={currentGuide.title}
          description={currentGuide.description}
          onNext={nextStep}
          onSkip={skipGuide}
        />
      )} */}

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
    backgroundColor: '#F9F9F9',
    width: '100%',
  },
  rangeBar: {
    paddingHorizontal: getResponsiveWidth(24),
    paddingBottom: getResponsiveHeight(4),
  },
  rangeText: {
    fontSize: getResponsiveFontSize(12),
    color: '#777',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: getResponsiveWidth(20),
    paddingVertical: getResponsiveHeight(16),
  },
  modalTitle: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'Pretendard-SemiBold',
    marginBottom: getResponsiveHeight(10),
  },
  modalSubTitle: {
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-SemiBold',
    color: '#555',
    marginBottom: getResponsiveHeight(6),
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getResponsiveWidth(8),
  },
  chip: {
    paddingHorizontal: getResponsiveWidth(10),
    paddingVertical: getResponsiveHeight(6),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: getResponsiveHeight(6),
  },
  chipActive: {
    backgroundColor: '#FFC84D',
    borderColor: '#FFC84D',
  },
  chipText: {
    fontSize: getResponsiveFontSize(12),
    color: '#555',
  },
  chipTextActive: {
    color: '#000',
    fontFamily: 'Pretendard-SemiBold',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: getResponsiveHeight(12),
  },
  textButton: {
    paddingVertical: getResponsiveHeight(4),
  },
  textButtonText: {
    fontSize: getResponsiveFontSize(13),
    color: '#222',
  },
  textButtonTextGray: {
    fontSize: getResponsiveFontSize(13),
    color: '#888',
  },
});
