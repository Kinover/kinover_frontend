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
import { useMemoryScreen } from '../hooks/useMemoryScreen';

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
          bottom: getResponsiveHeight(15),
          right: getResponsiveWidth(15),
          width: getResponsiveIconSize(75),
          height: getResponsiveIconSize(75),
          zIndex: 0,
        }}
        onPress={navigateToImageSelect}>
        <Image
          source={require('../../../assets/icons/posting-floating-bt.png')}
          style={{width: '100%', height: '100%', objectFit: 'contain'}}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
});
