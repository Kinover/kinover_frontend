import React, {useState, useLayoutEffect} from 'react';
import {View, StyleSheet, Text, TouchableOpacity, Image} from 'react-native';
import {useNavigation} from '@react-navigation/native';

import MemoryFeed from './pages/MemoryFeed';
import AnimatedAlbumTabSelector from './shared/albumTabSelector';
import CategoryBottomSheetModal from './category/categoryBottomSheet';
import {useSelector} from 'react-redux';
import {useRef} from 'react';

import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveIconSize,
} from '../../utils/responsive';

export default function MemoryScreen() {
  const navigation = useNavigation();
  const categorySheetRef = useRef(null);
  const categoryList = useSelector(state => state.category.categoryList);
  const [selectedTab, setSelectedTab] = useState('album');
  const [selectedCategory, setSelectedCategory] = useState(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          style={{
            paddingHorizontal: 31,
            paddingBottom: getResponsiveHeight(7.5),
            flexDirection: 'row',
            alignItems: 'center',
          }}
          onPress={() => {
            categorySheetRef.current?.present();
          }}>
          <Text
            style={{
              fontSize: 22,
              fontWeight: 'bold',
              color: '#4D4D4D',
            }}>
            {selectedCategory?.title || '전체'}
          </Text>
          {/* <Image
            source={require('../../assets/images/dropdown.png')} // 너의 드롭다운 화살표
            style={{width: 20, height: 20, marginLeft: 6}}
          /> */}
        </TouchableOpacity>
      ),
    });
  }, [navigation, selectedCategory]);

  return (
    <View style={styles.container}>
      <AnimatedAlbumTabSelector
        selected={selectedTab}
        onSelect={setSelectedTab}
      />
      <MemoryFeed
        selectedTab={selectedTab}
        selectedCategoryTitle={selectedCategory?.title || '전체'}
      />

      <CategoryBottomSheetModal
        ref={categorySheetRef}
        categoryList={categoryList}
        selectedCategory={selectedCategory}
        onSelectCategory={category => setSelectedCategory(category)}
        onCancel={() => {
          return;
        }}></CategoryBottomSheetModal>

      <TouchableOpacity
        style={{
          position: 'absolute',
          bottom: getResponsiveHeight(15),
          right: getResponsiveWidth(15),
          width: getResponsiveIconSize(75),
          height: getResponsiveIconSize(75),
          zIndex: 0,
        }}
        onPress={() => navigation.navigate('이미지선택화면')}>
        <Image
          source={require('../../assets/icons/posting-floating-bt.png')}
          style={{width: '100%', height: '100%', objectFit: 'contain'}}></Image>
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
