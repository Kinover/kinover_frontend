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

  return (
    <SwipeNavigator
      rightTo={null} // 오른쪽→왼쪽 스와이프
      leftTo="일정" // 필요하면 다른 화면 넣기
    >
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
            width: getResponsiveIconSize(60), // 🔽 75 → 60
            height: getResponsiveIconSize(60),
          }}
          onPress={navigateToImageSelect}>
          <Image
            source={require('../../../assets/icons/posting-floating-bt.png')}
            style={{width: '100%', height: '100%', objectFit: 'contain'}}
          />
        </TouchableOpacity>
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
