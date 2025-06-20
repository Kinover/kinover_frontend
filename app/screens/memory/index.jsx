import React, {useEffect, useLayoutEffect, useState, useRef} from 'react';
import {View, StyleSheet, Image, TouchableOpacity} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {fetchMemoryThunk} from '../../redux/thunk/memoryThunk';
import {fetchFamilyUserListThunk} from '../../redux/thunk/familyUserThunk';
import MemoryFeed from './memoryFeed';
import {getResponsiveHeight, getResponsiveWidth} from '../../utils/responsive';
import CategoryDropdownButton from './navigator/categoryDropdownButton';
import GalleryToggle from './navigator/galleryToggle';
import {useRoute} from '@react-navigation/native';
import CategoryBottomSheet from './navigator/categoryBottomSheet';

export default function MemoryScreen({navigation}) {
  const dispatch = useDispatch();
  const route = useRoute();
  const {family} = useSelector(state => state.family);
  const sheetRef = useRef(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const categoryList = useSelector(state => state.category.categoryList);
  const [selectedCategoryTitle, setSelectedCategoryTitle] = useState('전체');
  const [isGalleryView, setIsGalleryView] = useState(false);

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
      headerRight: () => (
        <View style={{paddingRight: getResponsiveWidth(20)}}>
          <GalleryToggle
            isGalleryView={isGalleryView}
            onToggle={setIsGalleryView}
          />
        </View>
      ),
      headerTitle: () => (
        <TouchableOpacity onPress={() => navigation.navigate('이미지선택화면')}>
          <Image
            source={require('../../assets/images/image-add-bt.png')}
            style={{
              width: getResponsiveWidth(35),
              height: getResponsiveHeight(35),
              resizeMode: 'contain',
            }}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, selectedCategoryTitle, isGalleryView]);

  return (
    <View style={styles.container}>
      <View style={styles.barContainer} />
      <View style={styles.bodyContainer}>
        <MemoryFeed
          selectedCategoryTitle={selectedCategoryTitle}
          isGalleryView={isGalleryView}
          setSelectedCategoryTitle={setSelectedCategoryTitle}
          setIsGalleryView={setIsGalleryView}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  barContainer: {
    width: '100%',
    height: getResponsiveHeight(5),
    backgroundColor: '#D9D9D9',
  },
  bodyContainer: {
    flex: 1,
    backgroundColor: 'white',
    paddingBottom: getResponsiveHeight(10),
  },
});
