import 'react-native-gesture-handler';
import React, {useEffect} from 'react';
import {
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  View,
  ScrollView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';
import {fetchChatRoomListThunk} from '../../redux/thunk/chatRoomThunk';
import FloatingButton from '../../utils/floatingButton';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../utils/responsive';

export default function CommunicationScreen({navigation}) {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user);
  const family = useSelector(state => state.family);
  const {chatRoomList, loading} = useSelector(state => state.chatRoom);

  useEffect(() => {
    if (family && user.userId !== null) {
      dispatch(fetchChatRoomListThunk(family.familyId, user.userId));
    }
  }, [dispatch, user.login, family.familyId]);

  const renderChatRoom = (chatRoom, index) => {
    let imageUri = chatRoom.image;
    let name = chatRoom.roomName;
    let description = '울 가족 오늘도 화이팅!';
    let screen = '채팅방화면';

    if (chatRoom.familyType === 'family') {
      screen = '채팅방화면';
    } else if (chatRoom.kino === true) {
      imageUri = 'https://i.postimg.cc/B6SmSRzS/Group-1171276570.jpg';
      name = '챗봇 키노';
      description = '가족 관계 고민을 키노에게 털어놓고 조언을 구해요!';
      screen = '키노상담소화면';
    } else if (chatRoom.familyType === 'personal') {
      description = '이따 두부 밥 좀 챙겨줘~';
    }

    return (
      <TouchableOpacity
        style={styles.bottomSheetElement}
        key={index}
        onPress={() => navigation.navigate(screen, {chatRoom, user})}>
        <Image style={styles.elementImage} source={{uri: imageUri}} />
        <View style={styles.textContainer}>
          <Text style={styles.elementName}>{name}</Text>
          <Text style={styles.elementDescription}>{description}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <Text style={styles.bottomSheetTitle}>채팅방</Text>

      <ScrollView>
        {loading ? null : chatRoomList?.length > 0 ? (
          chatRoomList.map(renderChatRoom)
        ) : (
          <Text style={styles.noChatRoomList}>
            {'아직 채팅방이 없어요.\n가족과의 첫 대화를 시작해볼까요?'}
          </Text>
        )}
      </ScrollView>

      <FloatingButton navigation={navigation} type="communication" />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: getResponsiveWidth(25),
    paddingTop: getResponsiveHeight(20),
  },

  bottomSheetTitle: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(24),
    marginBottom: getResponsiveIconSize(20),
    fontWeight: Platform.OS == 'ios' ? null : 'bold',
  },
  bottomSheetElement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveIconSize(10),
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
  textContainer: {
    flexDirection: 'column',
  },
  elementName: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(16.5),
    marginTop: getResponsiveIconSize(10),
    marginBottom: getResponsiveIconSize(10),
    fontWeight: Platform.OS == 'ios' ? null : 'bold',
  },
  elementDescription: {
    fontFamily: 'Pretendard-Light',
    fontSize: getResponsiveFontSize(12),
  },
  noChatRoomList: {
    fontSize: getResponsiveFontSize(16),
    color: '#777',
    textAlign: 'center',
    marginTop: getResponsiveHeight(100),
  },
});
