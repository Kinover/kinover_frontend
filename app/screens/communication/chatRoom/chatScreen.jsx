import React, {useEffect} from 'react';
import {View, StyleSheet, Text} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import ReceiveChat from './receiveChat';
import SendChat from './sendChat';
// import {fetchMessage} from '../../../redux/actions/messageActions';
import { fetchMessageThunk } from '../../../redux/thunk/messageThunk';
import {
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from '../../../utils/responsive';

export default function ChatScreen({chatRoom, user}) {
  const {messageList} = useSelector(state => state.message); // Redux 상태 가져오기
  const dispatch = useDispatch();

  useEffect(() => {
    if (chatRoom) {
      dispatch(fetchMessageThunk(chatRoom.chatRoomId));
    }
  }, [chatRoom]);

  // messages가 배열인지 확인하고 기본값을 빈 배열로 설정
  const message_list = Array.isArray(messageList) ? messageList : [];

  // 날짜를 YYYY-MM-DD 형식으로 변환하는 함수
  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  return (
    <>
      <View style={styles.chatContainer}>
        {message_list.length > 0 ? (
          message_list.map((message, index) => {
            const isSameSender =
              message_list[index - 1] &&
              message_list[index - 1].sender.userId === message.sender.userId;

            // 현재 메시지의 날짜
            const currentMessageDate = new Date(
              message.createdAt,
            ).toDateString();
            const prevMessageDate =
              index > 0
                ? new Date(message_list[index - 1].createdAt).toDateString()
                : null;

            return (
              <React.Fragment key={message.messageId}>
                {/* 날짜가 바뀌었으면 날짜 표시 */}
                {prevMessageDate !== currentMessageDate && (
                  <Text style={styles.dateSeparator}>
                    {formatDate(message.createdAt)}
                  </Text>
                )}

                {/* 수신 메시지 */}
                {message.sender.userId !== user.userId ? (
                  <ReceiveChat
                    userName={message.sender.name}
                    userProfileImage={message.sender.image}
                    message={message.content}
                    chatTime={message.createdAt}
                    style={{
                      marginBottom: isSameSender ? 15 : 25, // 같은 사람이면 간격 10, 다른 사람은 간격 20
                    }}
                  />
                ) : (
                  // 발신 메시지
                  <SendChat
                    message={message.content}
                    chatTime={message.createdAt}
                    style={{
                      marginBottom: isSameSender ? 15 : 25,
                    }}
                  />
                )}
              </React.Fragment>
            );
          })
        ) : (
          <Text>메세지가 없습니다.</Text>
        )}
      </View>
      {/* <ChatSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      /> */}
    </>
  );
}

const styles = StyleSheet.create({
  chatContainer: {
    width: getResponsiveWidth(350),
    alignSelf: 'center',
  },
  dateSeparator: {
    alignSelf: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: getResponsiveWidth(5),
    marginVertical: getResponsiveHeight(30),
    backgroundColor: 'rgba(255, 202, 85, 0.7)', // 투명도 0.5로 설정
    borderColor: 'transparent',
    borderRadius: getResponsiveIconSize(20),
    borderWidth: 10,
    color: '#666',
  },
});
