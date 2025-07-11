import React, {useEffect, useLayoutEffect, useState, useRef} from 'react';
import {View, StyleSheet, TouchableOpacity, Image} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {fetchMemoryThunk} from '../../redux/thunk/memoryThunk';
import {fetchFamilyUserListThunk} from '../../redux/thunk/familyUserThunk';
import MemoryFeed from './memoryFeed';
import {
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from '../../utils/responsive';
import CategoryDropdownButton from './navigator/categoryDropdownButton';
import GalleryToggle from './navigator/galleryToggle';
import {useRoute} from '@react-navigation/native';
import CategoryBottomSheet from './navigator/categoryBottomSheet';
import AlbumTabSelector from './albumTabSelector'; // 새로 만든 탭 컴포넌트

export default function MemoryScreen({navigation}) {
  const dispatch = useDispatch();
  const route = useRoute();
  const {family} = useSelector(state => state.family);
  const sheetRef = useRef(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const categoryList = useSelector(state => state.category.categoryList);
  const [selectedCategoryTitle, setSelectedCategoryTitle] = useState('전체');
  const [isGalleryView, setIsGalleryView] = useState(false);
  const [selectedTab, setSelectedTab] = useState('album'); // 'album' or 'allPhotos'

  useEffect(() => {
    if (family?.familyId) {
      dispatch(fetchMemoryThunk(family.familyId));
      dispatch(fetchFamilyUserListThunk(family.familyId));
    }
  }, [dispatch, family?.familyId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const categoryFromParams = route.params?.category;
      if (categoryFromParams?.title) {
        setSelectedCategoryTitle(categoryFromParams.title);
        navigation.setParams({category: undefined});
      }
    });
    return unsubscribe;
  }, [navigation, route.params]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitleAlign: 'center',
      headerLeft: () => (
        <CategoryDropdownButton
          selectedTitle={selectedCategoryTitle}
          onPress={() => {
            setIsSheetOpen(true);
            sheetRef.current?.snapToIndex(0);
          }}
          style={{paddingLeft: getResponsiveWidth(20)}}
        />
      ),
    });
  }, [navigation, selectedCategoryTitle]);

  return (
    <View style={styles.container}>
      <View style={styles.tabWrapper}>
        <AlbumTabSelector selected={selectedTab} onSelect={setSelectedTab} />
      </View>

      <View style={styles.bodyContainer}>
        <MemoryFeed
          selectedCategoryTitle={selectedCategoryTitle}
          isGalleryView={isGalleryView}
          setSelectedCategoryTitle={setSelectedCategoryTitle}
          setIsGalleryView={setIsGalleryView}
          selectedTab={selectedTab}
        />
      </View>

      {isSheetOpen && (
        <TouchableOpacity
          style={[StyleSheet.absoluteFill, styles.overlay]}
          activeOpacity={1}
          onPress={() => {
            setIsSheetOpen(false);
            sheetRef.current?.close();
          }}
        />
      )}
      <CategoryBottomSheet
        sheetRef={sheetRef}
        isVisible={isSheetOpen}
        categoryList={categoryList}
        selectedCategory={{title: selectedCategoryTitle}}
        onSelectCategory={cat => {
          setSelectedCategoryTitle(cat.title);
          setIsSheetOpen(false);
          sheetRef.current?.close();
        }}
        onCancel={() => {
          setIsSheetOpen(false);
          sheetRef.current?.close();
        }}
      />

      <TouchableOpacity>
        <Image
          source={require('../../assets/images/memory_floating-button.png')}
          style={{
            position: 'absolute',
            right: getResponsiveWidth(10),
            bottom: getResponsiveHeight(10),
            objectFit: 'contain',
          }}></Image>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#F9F9F9',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  tabWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingTop: getResponsiveHeight(8),
    paddingHorizontal: getResponsiveWidth(20),
    backgroundColor: 'white',
  },
  bodyContainer: {
    position: 'relative',
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
    alignSelf: 'center',
  },
});
