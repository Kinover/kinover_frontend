import React, {useEffect, useLayoutEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  Image,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useDispatch, useSelector} from 'react-redux';

import {fetchMemoryThunk} from '../../redux/thunk/memoryThunk';
import {fetchFamilyUserListThunk} from '../../redux/thunk/familyUserThunk';
import MemoryFeed from './memoryFeed';

import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../utils/responsive';
import FloatingButton from '../../utils/floatingButton';
import {SafeAreaView} from 'react-native-safe-area-context';

export default function MemoryScreen({navigation}) {
  const user = useSelector(state => state.user);
  const family = useSelector(state => state.family);
  const {familyUserList} = useSelector(state => state.userFamily);
  const dispatch = useDispatch();
  const [modalVisible, setModalVisible] = useState(false);
  const [noticeInput, setNoticeInput] = useState(family.notice);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    dispatch(fetchMemoryThunk(family.familyId));
    dispatch(fetchFamilyUserListThunk(family.familyId));
  }, [dispatch]);
  console.log('🔵 iOS 하단 inset:', insets.bottom);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            // 여기에 이미지 추가 로직 또는 페이지 이동
            navigation.navigate('이미지선택화면'); // 예: 업로드 화면으로 이동
          }}
          style={{marginRight: getResponsiveWidth(10)}}>
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
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.barContainer} />
      <View
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          minHeight: '100%', // ← 빈 공간 없어짐
        }}
        style={{flex: 1}}>
        <View style={styles.bodyContainer}>
          <MemoryFeed />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flex: 1,
    position: 'relative',
    backgroundColor: 'white',
  },

  bodyContainer: {
    flex: 1,
    backgroundColor: 'white',
  },

  barContainer: {
    width: '100%',
    height: getResponsiveHeight(5),
    backgroundColor: '#D9D9D9',
  },
});
