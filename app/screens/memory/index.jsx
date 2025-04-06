import React, {useEffect, useState} from 'react';
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
      <View style={{flex: 1, backgroundColor: '#FFCA55', borderWidth: 0}}>
        <ImageBackground
          style={styles.challengeBackground}
          source={{uri: 'https://i.postimg.cc/pLnqPb73/Group-480.png'}}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate(false ? '챌린지화면' : '추천챌린지화면')
            }>
            <Image
              source={{uri: 'https://i.postimg.cc/MZv3KFn0/Group-481-1.png'}}
              style={styles.challengeButton}
            />
          </TouchableOpacity>
        </ImageBackground>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.contentElement}>
          <Text style={styles.bottomSheetCategory}>멤버</Text>
          <View style={styles.memberList}>
            {familyUserList && (
              <FlatList
                data={familyUserList}
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
            <TouchableOpacity
              style={styles.noticeModifyButton}
              onPress={() => setModalVisible(true)}>
              <Image
                style={styles.noticeModifyButton}
                source={require('../../assets/images/familySetting_modify-family-name-button.png')}></Image>
            </TouchableOpacity>
            {family.notice ? (
              <Text style={styles.notice} numberOfLines={0}>
                {family.notice}
              </Text>
            ) : (
              <Text style={styles.noticeX} numberOfLines={0}>
                {'공지사항이 없습니다.'}
              </Text>
            )}
          </View>
        </View>
      </View>
    </>
  );

  return (
    <View style={{flex: 1, position: 'relative'}}>
      <FlatList
        style={styles.container}
        data={[]}
        renderItem={null}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={[styles.contentContainer, {paddingTop: 0}]}>
            <MemoryFeed />
            {setModalVisible ? (
              <NoticeModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                family={family}
                noticeInput={noticeInput}
                setNoticeInput={setNoticeInput}
              />
            ) : (
              <></>
            )}
          </View>
        }
        keyExtractor={index => index.toString()}
        scrollEnabled={true} // FlatList로 전체 스크롤을 처리
      />
      <FloatingButton type="memory" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: 'white',
  },

  challengeBackground: {
    width: '100%',
    height: getResponsiveHeight(180),
    justifyContent: 'center',
    alignItems: 'center',
  },

  challengeButton: {
    position: 'absolute',
    zIndex: 30,
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
    paddingTop: getResponsiveIconSize(40),
    paddingHorizontal: getResponsiveIconSize(25),
    backgroundColor: '#fff',
    marginBottom: getResponsiveHeight(20),
  },

  contentElement: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    minHeight: getResponsiveHeight(110),
    maxHeight: getResponsiveHeight(130),
    gap: getResponsiveHeight(10),
    paddingHorizontal: getResponsiveWidth(5),
  },

  bottomSheetCategory: {
    fontSize: getResponsiveFontSize(17),
    fontFamily: 'Pretendard-Regular',
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
    position: 'relative',
    borderWidth: 1,
    borderColor: '#FFC84D',
    borderRadius: 20,
    paddingVertical: getResponsiveHeight(15),
    paddingHorizontal: getResponsiveWidth(15),
    width: '100%',
    alignSelf: 'flex-start',
  },

  notice: {
    fontSize: getResponsiveFontSize(13),
    zIndex: 1,
    minHeight: getResponsiveHeight(20),
    width: '100%',
    lineHeight: getResponsiveHeight(20),
    flexWrap: 'wrap',
    fontFamily: 'Pretendard-Light',
    height: 'auto',
  },
  noticeX: {
    fontSize: getResponsiveFontSize(13),
    zIndex: 1,
    color: 'gray',
    minHeight: getResponsiveHeight(20),
    width: '100%',
    lineHeight: getResponsiveHeight(20),
    flexWrap: 'wrap',
    fontFamily: 'Pretendard-Light',
    height: 'auto',
  },

  noticeModifyButton: {
    position: 'absolute',
    top: -getResponsiveHeight(15),
    left: getResponsiveWidth(33),
    zIndex: 1,
    width: getResponsiveWidth(18),
    height: getResponsiveHeight(18),
  },

  dropdown: {
    width: getResponsiveWidth(85),
    borderWidth: 0,
    backgroundColor: 'black',
  },
});
