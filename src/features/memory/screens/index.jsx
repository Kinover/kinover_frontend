/* eslint-disable react-native/no-inline-styles */
// src/screens/memory/MemoryScreen.js
import React, {useMemo, useState} from 'react';
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
// import SwipeNavigator from 'components/SwipeNavigator';

// 공통 인앱 가이드
import useGuide from 'hooks/useGuide';
import GuideModal from 'components/GuideModal';
import PeriodFilterModal from '../components/PeriodFilterModal';

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

  // 'YYYY-MM-DD' → 'YYYY.MM.DD'로 보여주기
  const periodLabel = useMemo(() => {
    if (!startDate || !endDate) return null; // 설정 안 되어 있으면 null
    const formatDot = s => s.replace(/-/g, '.'); // 2025-11-01 → 2025.11.01
    return `${formatDot(startDate)} ~ ${formatDot(endDate)}`;
  }, [startDate, endDate]);

  const handleApplyPeriod = ({startDate: s, endDate: e}) => {
    // 전체 기간 선택한 경우: 둘 다 '' 내려오도록 했으면, 필터 해제
    setStartDate(s || '');
    setEndDate(e || '');
    setIsFilterVisible(false);
  };
  const getPresetLabel = preset => {
    switch (preset) {
      case 'LAST_1WEEK':
        return '최근 1주일';
      case 'LAST_2WEEK':
        return '최근 2주일';
      case 'LAST_4WEEK':
        return '최근 4주일';
      case 'THIS_WEEK':
        return '이번 주';
      case 'PREV_WEEK':
        return '지난 주';
      case 'THIS_MONTH':
        return '이번 달';
      default:
        return '전체 기간';
    }
  };

  return (
    // <SwipeNavigator rightTo={null} leftTo="일정">
    <View style={styles.container}>
      <AnimatedAlbumTabSelector
        selected={selectedTab}
        onSelect={setSelectedTab}
        onPressDateFilter={() => setIsFilterVisible(true)}
        periodLabel={periodLabel} // ✅ 여기!
      />

      <MemoryFeed
        selectedTab={selectedTab}
        selectedCategoryTitle={selectedCategoryTitle}
        startDate={startDate}
        endDate={endDate}
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
          bottom: getResponsiveHeight(20),
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

      {/* 🔹 구체적인 기간 설정 모달 */}
      <PeriodFilterModal
        visible={isFilterVisible}
        onClose={() => setIsFilterVisible(false)}
        onApply={handleApplyPeriod}
        initialStartDate={startDate}
        initialWeeks={1}
      />
    </View>
    // </SwipeNavigator>
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

  // 모달
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
