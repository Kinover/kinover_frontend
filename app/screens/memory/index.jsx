import React, {useEffect, useLayoutEffect, useState} from 'react';
import {View, StyleSheet, Image, TouchableOpacity} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {fetchMemoryThunk} from '../../redux/thunk/memoryThunk';
import {fetchFamilyUserListThunk} from '../../redux/thunk/familyUserThunk';
import MemoryFeed from './memoryFeed';
import {getResponsiveHeight, getResponsiveWidth} from '../../utils/responsive';
import CategoryDropdownButton from './categoryDropdownButton';
import GalleryToggle from './galleryToggle';
import {useRoute} from '@react-navigation/native';

export default function MemoryScreen({navigation}) {
  const dispatch = useDispatch();
  const route = useRoute();
  const {family} = useSelector(state => state.family);

  const [selectedCategoryTitle, setSelectedCategoryTitle] = useState('전체');
  const [isGalleryView, setIsGalleryView] = useState(false);

  useEffect(() => {
    if (family?.familyId) {
      dispatch(fetchMemoryThunk(family.familyId));
      dispatch(fetchFamilyUserListThunk(family.familyId));
    }
  }, [dispatch, family?.familyId]);

  // ✅ 포커스될 때 카테고리 변경 적용
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const categoryFromParams = route.params?.category;
      if (categoryFromParams?.title) {
        setSelectedCategoryTitle(categoryFromParams.title);
        navigation.setParams({category: undefined}); // 초기화
      }
    });

    return unsubscribe;
  }, [navigation, route.params]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <View style={{marginLeft: getResponsiveWidth(15)}}>
          <CategoryDropdownButton
            selectedTitle={selectedCategoryTitle}
            onPress={() => navigation.navigate('카테고리화면')}
          />
        </View>
      ),
      headerRight: () => (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 10,
            paddingRight: getResponsiveWidth(15),
          }}>
          <GalleryToggle
            isGalleryView={isGalleryView}
            onToggle={setIsGalleryView}
          />
          <TouchableOpacity
            onPress={() => navigation.navigate('이미지선택화면')}
            style={{paddingRight: 4}}>
            <Image
              source={require('../../assets/images/image-add-bt.png')}
              style={{
                width: getResponsiveWidth(30),
                height: getResponsiveHeight(30),
                resizeMode: 'contain',
              }}
            />
          </TouchableOpacity>
        </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
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
