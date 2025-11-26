/* eslint-disable react-native/no-inline-styles */
// MemoryScreen.js
import React from 'react';
import {View, StyleSheet, TouchableOpacity, Image} from 'react-native';

import MemoryFeed from './MemoryFeedScreen';
import AnimatedAlbumTabSelector from '../components/AlbumTabSelector';
import CategoryBottomSheetModal from '../components/CategoryBottomSheet';

import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveIconSize,
} from '../../../utils/responsive';
import {useMemoryScreen} from '../hooks/useMemoryScreen';
import SwipeNavigator from 'components/SwipeNavigator';

// 🔹 공통 인앱 가이드
import useGuide from 'hooks/useGuide';
import GuideModal from 'components/GuideModal';

// 🔹 추억 화면 가이드 스텝
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

  // 🔹 인앱 가이드 — 추억 화면 기준
  const {
    isGuideVisible,
    guideStep,
    currentGuide,
    totalSteps,
    nextStep,
    skipGuide,
  } = useGuide('MEMORY_GUIDE_SHOWN_V1', MEMORY_GUIDE_STEPS, true); // 테스트 위해 true 유지

  return (
    <SwipeNavigator rightTo={null} leftTo="일정">
      <View style={styles.container}>
        <AnimatedAlbumTabSelector
          selected={selectedTab}
          onSelect={setSelectedTab}
        />

        <MemoryFeed
          selectedTab={selectedTab}
          selectedCategoryTitle={selectedCategoryTitle}
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

        {/* 🔹 인앱 가이드 모달 */}
        {currentGuide && (
          <GuideModal
            visible={isGuideVisible}
            step={guideStep}
            totalSteps={totalSteps}
            title={currentGuide.title}
            description={currentGuide.description}
            onNext={nextStep}
            onSkip={skipGuide}
          />
        )}
      </View>
    </SwipeNavigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
});
