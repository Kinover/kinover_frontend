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

export default function MemoryScreen({navigation}) {
  const {memories} = useSelector(state => state.memory);
  const user = useSelector(state => state.user);
  const family = useSelector(state => state.family);
  const {familyUsers} = useSelector(state => state.userFamily);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);

  useEffect(() => {
    dispatch(fetchMemory(family.familyId));
    dispatch(fetchFamilyUsers(family.familyId));
  }, [dispatch]);

  // 유저 ID를 기준으로 familyUsers 배열을 정렬하는 함수
  const sortFamilyUsers = familyUsers => {
    // user.userId와 동일한 user를 먼저 정렬
    return [...familyUsers].sort((a, b) => {
      if (a.userId === user.userId) return -1; // user.userId와 같으면 맨 앞에 오도록
      if (b.userId === user.userId) return 1;
      return 0; // 그 외에는 순서 유지
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
        {/* <TouchableOpacity onPress={() => navigation.navigate('챌린지 화면')}> */}
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
        <DropDownPicker
          open={open}
          value={value}
          items={[
            {label: '최신순', value: '최신순'},
            {label: '인기순', value: '인기순'},
            {label: '댓글순', value: '댓글순'},
          ]}
          setOpen={setOpen}
          setValue={setValue}
          placeholder="정렬"
          containerStyle={{
            zIndex: 9999,
            width: getResponsiveWidth(85),
          }} // 부모 컨테이너에도 zIndex와 width 추가
          style={styles.dropdown}
          scrollViewProps={{
            showsVerticalScrollIndicator: false,
          }}
          textStyle={{fontSize: getResponsiveFontSize(15)}} // textStyle 추가
        />
      </View>
    </>
  );

  const renderMemoryFeed = ({item}) => {
    return (
      <View style={styles.contentContainer}>
        <MemoryFeed item={item} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        style={styles.mainContainer}
        data={memories} // 더미 데이터를 flatlist에 전달
        renderItem={renderMemoryFeed} // MemoryFeed를 flatlist 아이템으로 전달
        ListHeaderComponent={renderHeader} // header로 렌더링할 요소들
        keyExtractor={item => item.memoryId}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingBottom: getResponsiveHeight(0),
        }} // 추가 여백
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
    display: 'flex',
    // backgroundColor: '#FFFFFF',
    backgroundColor: 'white',
    alignContent: 'flex-start',
    // justifyContent:'flex-start'
    gap: 0,
  },

  challengeBackground: {
    width: getResponsiveWidth(393),
    height: getResponsiveHeight(180),
    justifyContent: 'center',
    // alignSelf:'flex-start',
    alignItems: 'center',
    // marginTop: 0,
    // objectFit:'cover',
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
    paddingTop: getResponsiveIconSize(25),
    paddingRight: getResponsiveIconSize(25),
    paddingLeft: getResponsiveIconSize(25),
    backgroundColor: '#fff',
    gap: getResponsiveWidth(30),
  },

  contentElement: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: getResponsiveHeight(60),
    gap: getResponsiveHeight(10),
    marginBottom: getResponsiveHeight(20),
  },

  bottomSheetCategory: {
    fontSize: getResponsiveFontSize(15),
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
    lineHeight: getResponsiveHeight(23),
    flexWrap: 'wrap',
  },

  dropdown: {
    width: getResponsiveWidth(85),
    borderWidth: 0,
    zIndex: 999,
  },
});
