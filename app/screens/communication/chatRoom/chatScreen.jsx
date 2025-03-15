import React, {useEffect} from 'react';
import {View, StyleSheet, Text} from 'react-native';
import {useSelector, useDispatch} from 'react-redux';
import ReceiveChat from './receiveChat';
import SendChat from './sendChat';
import {fetchMessage} from '../../../redux/actions/messageActions';
import {getResponsiveWidth} from '../../../utils/responsive';

export default function ChatScreen({chatRoom, user}) {
  const {messages} = useSelector(state => state.message); // Redux 상태 가져오기
  const dispatch = useDispatch();

  useEffect(() => {
    if (chatRoom) {
      dispatch(fetchMessage(chatRoom.chatRoomId));
    }
  }, [chatRoom]);

  // messages가 배열인지 확인하고 기본값을 빈 배열로 설정
  const messageList = Array.isArray(messages) ? messages : [];

  return (
    <View>
      {messageList.length > 0 ? (
        messageList.map(message => {
          // 수신메세지
          if (message.sender.userId !== user.userId) {
            return (
              <ReceiveChat
                key={message.messageId} // 각 컴포넌트에 고유 키를 추가
                userName={message.sender.name}
                userProfileImage={message.sender.image}
                message={message.content}
                chatTime={message.createdAt}></ReceiveChat>
            );
          } else if (message.sender.userId === user.userId) {
            return (
              <SendChat
                key={message.messageId} // 각 컴포넌트에 고유 키를 추가
                message={message.content}
                chatTime={message.createdAt}></SendChat>
            );
          }
        })
      ) : (
        <Text> 메세지가 없습니다. </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chatContainer: {
    width: getResponsiveWidth(330),
    // height: getResponsiveHeight(80),
  },
});
