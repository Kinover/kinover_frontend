import React, {useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {fetchChatRoomListThunk} from '../../redux/thunk/chatRoomThunk';
import FloatingButton from '../../components/floatingButton';
import ChatRoomItem from './chatRoomItem';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
} from '../../utils/responsive';

export default function CommunicationScreen({navigation}) {
  const dispatch = useDispatch();
  const {userId, login} = useSelector(state => state.user);
  const {familyId} = useSelector(state => state.family);
  const {chatRoomList, loading} = useSelector(state => state.chatRoom);

  useEffect(() => {
    if (familyId && userId !== null) {
      dispatch(fetchChatRoomListThunk(familyId, userId));
    }
  }, [familyId, userId, login]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#FFC84D"
            style={styles.loader}
          />
        ) : chatRoomList?.length > 0 ? (
          chatRoomList.map((chatRoom, index) => (
            <ChatRoomItem
              key={chatRoom.chatRoomId}
              chatRoom={chatRoom}
              userId={userId}
              navigation={navigation}
            />
          ))
        ) : (
          <Text style={styles.noChatMessage}>
            {'아직 채팅방이 없어요.\n가족과의 첫 대화를 시작해볼까요?'}
          </Text>
        )}
      </ScrollView>

      <FloatingButton navigation={navigation} type="communication" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    paddingHorizontal: getResponsiveWidth(20),
    paddingTop: getResponsiveHeight(10),
  },
  scrollContent: {
  },
  noChatMessage: {
    fontSize: getResponsiveFontSize(16),
    color: '#777',
    textAlign: 'center',
    marginTop: getResponsiveHeight(100),
    lineHeight: getResponsiveFontSize(24),
    paddingHorizontal: getResponsiveWidth(10),
  },
  loader: {
    alignSelf: 'center',
    marginTop: getResponsiveHeight(100),
  },
});
