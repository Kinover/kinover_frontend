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

import {useDispatch, useSelector} from 'react-redux';

import {fetchMemoryThunk} from '../../redux/thunk/memoryThunk';
import {fetchFamilyUserListThunk} from '../../redux/thunk/familyUserThunk';
import MemoryFeed from './memoryFeed';

import NoticeModal from './noticeModal';

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
  const {challenge} = useSelector(state => state.challenge);
  const {familyUserList} = useSelector(state => state.userFamily);
  const dispatch = useDispatch();
  const [modalVisible, setModalVisible] = useState(false);
  const [noticeInput, setNoticeInput] = useState(family.notice);

  useEffect(() => {
    dispatch(fetchMemoryThunk(family.familyId));
    dispatch(fetchFamilyUserListThunk(family.familyId));
  }, [dispatch]);

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
    <SafeAreaView style={styles.container} edges={['top,bottom,left,right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{flexGrow: 1}}>
        <View style={styles.bodyContainer}>
          <MemoryFeed />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#D9D9D9',
  },

  bodyContainer: {
    flex: 1,
    top: getResponsiveHeight(5),
    backgroundColor: 'white',
  },

  barContainer: {
    width: '100%',
    height: getResponsiveHeight(40),
    backgroundColor: 'pink',
  },
});
