import React, {useState, useRef} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  Image,
} from 'react-native';
import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveIconSize,
} from '../../../utils/responsive';

export default function ChatInput({chatRoom, user, socketRef}) {
  const [message, setMessage] = useState('');
  const inputRef = useRef(null);

  const handleSend = () => {
    if (!message.trim()) return;

    const socket = socketRef?.current;
    if (!socket || socket.readyState !== 1) {
      alert('연결이 불안정해요. 다시 시도해주세요.');
      return;
    }

    const newMessage = {
      content: message,
      chatRoomId: chatRoom.chatRoomId,
      senderId: user.userId,
      messageType: 'text',
    };

    socket.send(JSON.stringify(newMessage));
    console.log('📤 WebSocket 전송:', newMessage);
    setMessage('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.innerContainer}>
          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.inputPlusButton}>
              <Image
                source={{uri: 'https://i.postimg.cc/yxdVHRq7/Group-478.png'}}
                style={{
                  width: getResponsiveIconSize(24),
                  height: getResponsiveIconSize(24),
                }}
              />
            </TouchableOpacity>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={message}
              onChangeText={setMessage}
              placeholder="메시지를 입력하세요"
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
          </View>
          <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
            <Image
              source={{uri: 'https://i.postimg.cc/fLWscdRY/Group-477-1.png'}}
              style={{
                width: getResponsiveWidth(24),
                height: getResponsiveHeight(24),
              }}
            />
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: getResponsiveHeight(70),
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveHeight(10),
    paddingHorizontal: getResponsiveWidth(17.5),
    gap: getResponsiveWidth(12),
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: getResponsiveHeight(37),
    borderWidth: 1,
    borderColor: '#FFC84D',
    borderRadius: 30,
    backgroundColor: 'rgba(255, 231, 178, 0.2)',
    paddingHorizontal: getResponsiveWidth(7.5),
  },
  input: {
    flex: 1,
    height: '100%',
  },
  inputPlusButton: {
    marginRight: 10,
  },
  sendButton: {
  },
});
