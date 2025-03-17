import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  Image,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';

import {useDispatch, useSelector} from 'react-redux';
import {fetchMemory} from '../../redux/actions/memoryActions';
import {fetchFamily} from '../../redux/actions/familyActions';
import {fetchFamilyUsers} from '../../redux/actions/userFamilyActions';
import FloatingButton from './floatingButton';
import MemoryFeed from './memoryFeed';
import DropDownPicker from 'react-native-dropdown-picker'; // 드롭다운 패키지 임포트

import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../utils/responsive';
import {opacity} from 'react-native-reanimated/lib/typescript/Colors';

export default function MemoryScreen({navigation}) {
  const {memories} = useSelector(state => state.memory);
  const user = useSelector(state => state.user);
  const family = useSelector(state => state.family);
  const {familyUsers} = useSelector(state => state.userFamily);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchMemory(family.familyId));
    dispatch(fetchFamilyUsers(family.familyId));
  }, [dispatch]);

  // 유저 ID를 기준으로 familyUsers 배열을 정렬하는 함수
  const sortFamilyUsers = familyUsers => {
    return [...familyUsers].sort((a, b) => {
      if (a.userId === user.userId) return -1;
      if (b.userId === user.userId) return 1;
      return 0;
    });
  };

  const renderMember = ({item}) => {
    return (
      <View style={{marginTop: getResponsiveHeight(5)}}>
        <Image
          source={{uri: item.image}}
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            borderColor: 'lightgray',
            borderWidth: getResponsiveIconSize(0.7),
            marginRight: getResponsiveWidth(15),
          }}
        />
      </View>
    );
  };

  const renderHeader = () => (
    <>
      <ImageBackground
        style={styles.challengeBackground}
        source={{uri: 'https://i.postimg.cc/pLnqPb73/Group-480.png'}}>
        <TouchableOpacity onPress={() => navigation.navigate('추천 챌린지')}>
          <Image
            source={{uri: 'https://i.postimg.cc/MZv3KFn0/Group-481-1.png'}}
            style={styles.challengeButton}
          />
        </TouchableOpacity>
      </ImageBackground>

      <View style={styles.contentContainer}>
        <View style={styles.contentElement}>
          <Text style={styles.bottomSheetCategory}>멤버</Text>
          <View style={styles.memberList}>
            {familyUsers && (
              <FlatList
                data={sortFamilyUsers(familyUsers)} // 정렬된 familyUsers를 전달
                renderItem={renderMember}
                keyExtractor={(item, index) => index.toString()}
                horizontal={true}
                nestedScrollEnabled={true}
              />
            )}
          </View>
        </View>

        <View style={styles.contentElement}>
          <Text style={styles.bottomSheetCategory}>공지사항</Text>
          <View style={styles.noticeContainer}>
            <Text style={styles.notice} numberOfLines={0}>
              {family.notice}
            </Text>
          </View>
        </View>
      </View>
    </>
  );

  const renderMemoryFeed = ({item}) => {
    return (
      <View
        style={[styles.contentContainer, {paddingTop: getResponsiveHeight(5)}]}>
        <MemoryFeed item={item} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        style={styles.mainContainer}
        data={memories}
        renderItem={renderMemoryFeed}
        ListHeaderComponent={renderHeader}
        keyExtractor={item => item.memoryId}
        keyboardShouldPersistTaps="handled"
      />
      <FloatingButton style={{zIndex: 10}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  mainContainer: {
    flex: 1,
    backgroundColor: 'white',
    alignContent: 'flex-start',
    gap: 0,
  },

  challengeBackground: {
    width: getResponsiveWidth(393),
    height: getResponsiveHeight(180),
    justifyContent: 'center',
    alignItems: 'center',
  },

  challengeButton: {
    position: 'absolute',
    zIndex: 3,
    width: getResponsiveWidth(300),
    height: getResponsiveHeight(43),
    alignSelf: 'center',
    top: getResponsiveHeight(23),
  },

  contentContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    paddingTop: getResponsiveIconSize(25),
    paddingHorizontal: getResponsiveIconSize(25),
    backgroundColor: '#fff',
    gap: getResponsiveWidth(23),
    marginBottom: getResponsiveHeight(30),
  },

  contentElement: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: getResponsiveHeight(60),
    gap: getResponsiveHeight(10),
    marginBottom: getResponsiveHeight(25),
    paddingHorizontal: getResponsiveWidth(5),
  },

  bottomSheetCategory: {
    fontSize: getResponsiveFontSize(15),
    fontFamily:'Pretendard-Regular',
  },

  memberList: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
    gap: getResponsiveIconSize(20),
  },

  noticeContainer: {
    borderWidth: 1,
    borderColor: '#FFC84D',
    borderRadius: 20,
    paddingVertical: getResponsiveHeight(15),
    paddingHorizontal: getResponsiveWidth(15),
    width: '100%',
    alignSelf: 'flex-start',
  },

  notice: {
    fontSize: 13,
    zIndex: 1,
    height: getResponsiveHeight(50),
    width: '100%',
    lineHeight: getResponsiveHeight(25),
    flexWrap: 'wrap',
    fontFamily:'Pretendard-Light',
  },

  dropdown: {
    width: getResponsiveWidth(85),
    borderWidth: 0,
    // zIndex: 999,
    backgroundColor: 'black',
  },
});
