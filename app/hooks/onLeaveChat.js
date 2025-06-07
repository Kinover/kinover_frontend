import { Alert } from 'react-native';
import { leaveChatRoomThunk } from '../redux/thunk/chatRoomThunk';

export const onLeaveChat = (dispatch, navigation, chatRoomId) => {
  dispatch(leaveChatRoomThunk(chatRoomId))
    .unwrap()
    .then(() => {
      Alert.alert('채팅방을 나갔습니다.');
      navigation.goBack();
    })
    .catch(err => {
      console.error('❌ 나가기 실패:', err);
      Alert.alert(
        '채팅방 나가기 실패',
        typeof err === 'string' ? err : '다시 시도해 주세요'
      );
    });
};