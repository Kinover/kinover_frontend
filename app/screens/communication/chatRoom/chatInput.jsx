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
import {useDispatch, useSelector} from 'react-redux';
import { fetchMessageThunk,sendMessageThunk } from '../../../redux/thunk/messageThunk';

export default ChatInput = ({chatRoom}) => {
  const user = useSelector(state => state.user);
  const [message, setMessage] = useState('');
  const [data, setData] = useState({});
  const inputRef = useRef(null); // TextInput에 ref 추가
  const dispatch = useDispatch();

  const handleSend = ({chatRoom}) => {
    if (message.trim().length > 0 && chatRoom?.chatRoomId) {
      const newMessage = {
        messageId: null,
        content: message, // 메시지 내용
        createdAt: new Date().toISOString(), // 현재 시간 (ISO 포맷으로 변환)
        chatRoom: chatRoom, // 채팅방 ID
        messageType: 'text', // 메시지 타입 (예: text, image 등)
        sender: user, // 보낸 사람의 ID
      };

      setData(newMessage); // 데이터 세팅
      dispatch(sendMessageThunk(newMessage, chatRoom)); // 메시지 보내기
      setMessage(''); // 메시지 초기화
    }
  };

  const handleFocus = () => {
    if (inputRef.current) {
      inputRef.current.focus(); // 강제로 포커스 설정
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
      <TouchableWithoutFeedback
        onPress={() => {
          // 키보드 dismiss와 포커스 처리
          if (inputRef.current && !inputRef.current.isFocused()) {
            inputRef.current.focus(); // 첫 번째 클릭 시 포커스 설정
          } else {
            Keyboard.dismiss(); // 두 번째 클릭 시 키보드 숨기기
          }
        }}
        accessible={false}>
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
              ref={inputRef} // TextInput에 ref 연결
              style={styles.input}
              value={message}
              onChangeText={setMessage}
              placeholder="메시지를 입력하세요"
              returnKeyType="send"
              onSubmitEditing={() => handleSend({chatRoom})}
              onFocus={handleFocus} // 포커스 시 처리
              autoFocus={false} // autoFocus는 false로 설정
            />
          </View>
          <TouchableOpacity
            onPress={() => handleSend({chatRoom})}
            style={styles.sendButton}>
            <Image
              source={{uri: 'https://i.postimg.cc/fLWscdRY/Group-477-1.png'}}
              style={{
                width: getResponsiveWidth(26),
                height: getResponsiveHeight(26),
              }}
            />
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};
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
    paddingVertical: 10,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: getResponsiveHeight(37),
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#FFC84D',
    borderRadius: 30,
    backgroundColor: 'rgba(255, 231, 178, 0.2)',
    paddingHorizontal: getResponsiveWidth(10),
  },
  input: {
    flex: 1,
    height: '100%',
  },
  inputPlusButton: {
    marginRight: 10,
  },
  sendButton: {
    padding: 8,
  },
});
