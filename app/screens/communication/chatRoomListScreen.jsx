import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../utils/responsive';
import { fetchChatRoomListThunk } from '../../redux/thunk/chatRoomThunk';

export default function ChatRoomListScreen({ navigation }) {
  const dispatch = useDispatch();
  const { chatRoomList, loading } = useSelector(state => state.chatRoom);
  const user = useSelector(state => state.user);
  const family = useSelector(state => state.family);

  useEffect(() => {
    if (family && user?.userId != null) {
      dispatch(fetchChatRoomListThunk(family.familyId, user.userId));
    }
  }, [dispatch, user.userId, family.familyId]);

  const handleNavigate = (screen, chatRoom) => {
    navigation.navigate(screen, { chatRoom, user });
  };

  const renderChatRoomItem = (chatRoom, index) => {
    let title = chatRoom.roomName;
    let description = '울 가족 오늘도 화이팅!';
    let screen = '채팅방화면';

    if (chatRoom.kino) {
      title = '챗봇 키노';
      description = '가족 관계 고민을 키노에게 털어놓고 조언을 구해요!';
      screen = '키노상담소화면';
    } else if (chatRoom.familyType === 'family') {
      screen = '가족채팅방화면';
    }

    return (
      <TouchableOpacity
        key={chatRoom.roomId}
        style={styles.bottomSheetElement}
        onPress={() => handleNavigate(screen, chatRoom)}
      >
        <Image
          style={styles.elementImage}
          source={{ 
            uri: chatRoom.kino
              ? 'https://i.postimg.cc/B6SmSRzS/Group-1171276570.jpg'
              : chatRoom.image,
          }}
        />
        <View style={styles.textContainer}>
          <Text style={styles.elementName}>{title}</Text>
          <Text style={styles.elementDescription}>{description}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>채팅방</Text>

      {!loading && Array.isArray(chatRoomList) && chatRoomList.length > 0 ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          {chatRoomList.map(renderChatRoomItem)}
        </ScrollView>
      ) : (
        <View style={styles.noChatRoomContainer}>
          <Text style={styles.noChatRoomText}>
            {'아직 채팅방이 없어요.\n가족과의 첫 대화를 시작해볼까요?'}
          </Text>
        </View>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: getResponsiveIconSize(25),
    backgroundColor: '#fff',
    gap: getResponsiveHeight(15),
  },
  title: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(24),
    marginTop: getResponsiveHeight(20),
  },
  bottomSheetElement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveHeight(15),
    height: getResponsiveHeight(75),
    gap: getResponsiveWidth(20),
  },
  elementImage: {
    width: getResponsiveWidth(73),
    height: getResponsiveHeight(73),
    borderRadius: getResponsiveWidth(36.5),
    resizeMode: 'cover',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  elementName: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(30),
    marginBottom: getResponsiveHeight(5),
  },
  elementDescription: {
    fontFamily: 'Pretendard-Light',
    fontSize: getResponsiveFontSize(11),
    color: '#444',
  },
  noChatRoomContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noChatRoomText: {
    fontSize: getResponsiveFontSize(16),
    color: '#777',
    textAlign: 'center',
  },
});
