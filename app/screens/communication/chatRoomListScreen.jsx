import BottomSheet, {BottomSheetView} from '@gorhom/bottom-sheet';
import React, {useState, useEffect} from 'react';
import {useSelector, useDispatch} from 'react-redux'; // useSelector로 가져오고, useDispatch로 알림
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../utils/responsive';
import {fetchChatRoomListThunk} from '../../redux/thunk/chatRoomThunk';

export default function ChatRoomListScreen({navigation}) {
  const [bottomSheetIndex, setBottomSheetIndex] = useState(1); // 기본적으로 75%로 시작
  const {chatRoomList, loading, error} = useSelector(state => state.chatRoom);
  const dispatch = useDispatch();
  const user = useSelector(state => state.user);
  const family = useSelector(state => state.family);

  // 챗룸 리스트 fetch
  useEffect(() => {
    if (family && user.userId !== null) {
      console.log('fetchChatRoomList 실행됨');
      dispatch(fetchChatRoomListThunk(family.familyId, user.userId));
    }
  }, [dispatch, user.login, family.familyId]); // familyId와 userId가 업데이트 된 후에 실행

  return (
    <BottomSheet
      index={bottomSheetIndex} // index 상태에 따라 바텀 시트가 열림
      snapPoints={['10%', '75%']} // 기본 높이를 75%로 고정
      initialSnapIndex={1} // 기본적으로 75%로 시작
      // animateOnMount={true}  // 처음부터 바로 75%로 열리게 설정
      // style={{ minHeight: "75%" }} // 최소 높이 설정

      onChange={index => setBottomSheetIndex(index)} // BottomSheet 상태 변경
      handleIndicatorStyle={{display: 'none'}} // 아이콘 숨기기
    >
      <BottomSheetView style={styles.bottomSheetContainer}>
        <Text style={styles.bottomSheetTitle}>채팅방</Text>

        {/* 가족, 개인 채팅방 */}
        {!loading && Array.isArray(chatRoomList) && chatRoomList.length > 0 ? (
          chatRoomList.map((chatRoom, index) => {
            // roomType이 'family'인 경우 가족 채팅방 렌더링

            if (chatRoom.kino === true) {
              return (
                <TouchableOpacity style={styles.bottomSheetElement} key={index}>
                  <Image
                    style={styles.elementImage}
                    source={{
                      uri: 'https://i.postimg.cc/B6SmSRzS/Group-1171276570.jpg',
                    }}></Image>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('키노상담소화면', {
                        chatRoom,
                        user,
                      })
                    }>
                    <View style={{display: 'flex', flexDirection: 'column'}}>
                      <Text style={styles.elementName}>챗봇 키노</Text>
                      <Text style={styles.elementDescription}>
                        가족 관계 고민을 키노에게 털어놓고 조언을 구해요!
                      </Text>
                    </View>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            } else if (chatRoom.familyType === 'family') {
              return (
                <TouchableOpacity style={styles.bottomSheetElement} key={index}>
                  <Image
                    style={styles.elementImage}
                    source={{
                      uri: chatRoom.image,
                    }}
                  />
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('가족채팅방화면', {
                        chatRoom,
                        user,
                      })
                    }>
                    <View style={{display: 'flex', flexDirection: 'column'}}>
                      <Text style={styles.elementName}>
                        {chatRoom.roomName}
                      </Text>
                      <Text style={styles.elementDescription}>
                        울 가족 오늘도 화이팅!
                      </Text>
                    </View>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            }
            // roomType이 'oneToOne'인 경우 개인 채팅방 렌더링
            else if (chatRoom.familyType === 'personal') {
              return (
                <TouchableOpacity style={styles.bottomSheetElement} key={index}>
                  <Image
                    style={styles.elementImage}
                    source={{
                      uri: chatRoom.image,
                    }}
                  />
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('채팅방화면', {
                        chatRoom,
                        user,
                      })
                    }>
                    <View style={{display: 'flex', flexDirection: 'column'}}>
                      <Text style={styles.elementName}>
                        {chatRoom.roomName}
                      </Text>
                      <Text style={styles.elementDescription}>
                        이따 두부 밥 좀 챙겨줘~
                      </Text>
                    </View>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            }
          })
        ) : (
          <Text style={styles.noChatRoomList}>
            {'아직 채팅방이 없어요.\n가족과의 첫 대화를 시작해볼까요?'}
          </Text>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  bottomSheetContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    paddingTop: getResponsiveIconSize(5),
    paddingRight: getResponsiveIconSize(25),
    paddingLeft: getResponsiveIconSize(25),
    backgroundColor: '#fff',
    gap: getResponsiveWidth(15),
  },

  bottomSheetTitle: {
    fontFamily: 'Pretendard-SemiBold', // Regular 폰트 적용
    fontSize: getResponsiveFontSize(24),
    marginBottom: getResponsiveIconSize(15),
  },

  bottomSheetElement: {
    display: 'flex',
    flexDirection: 'row',
    fontFamily: 'Pretendard-Regular', // Regular 폰트 적용
    fontSize: getResponsiveFontSize(18),
    marginBottom: getResponsiveIconSize(10),
    justifyContent: 'flex-start',
    width: '100%',
    height: getResponsiveHeight(75),
    gap: getResponsiveWidth(20),
  },

  elementImage: {
    width: getResponsiveWidth(73),
    height: getResponsiveHeight(73),
    borderRadius: getResponsiveIconSize(36.5),
    resizeMode: 'cover',
  },

  elementName: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(15),
    marginTop: getResponsiveIconSize(10),
    marginBottom: getResponsiveIconSize(10),
  },

  elementDescription: {
    fontFamily: 'Pretendard-Light',
    fontSize: getResponsiveFontSize(11),
  },
  noChatRoomList: {
    fontSize: getResponsiveFontSize(16),
    color: '#777',
    textAlign: 'center',
    marginTop: getResponsiveHeight(100),
  },
});
