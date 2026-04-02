// hooks/onLeaveChat.js
// RTK Query 마이그레이션: leaveChatRoomThunk → chatApi.endpoints.leaveChatRoom.initiate

import {removeChatRoomFromList} from '../store/chatRoomSlice';
import {chatApi} from '../services/chatApi';

/**
 * @param {Function} dispatch - redux dispatch
 * @param {any} navigation - react-navigation navigation 객체
 * @param {string} chatRoomId - 나갈 채팅방 ID
 * @param {Function} showToast - 메시지 문자열을 받아 ToastModal 띄우는 함수
 */
export const onLeaveChat = (dispatch, navigation, chatRoomId, showToast) => {
  // hooks 밖에서 RTK Query mutation 호출: endpoints.xxx.initiate 사용
  dispatch(chatApi.endpoints.leaveChatRoom.initiate(chatRoomId))
    .unwrap()
    .then(() => {
      // 리스트에서 해당 채팅방 즉시 제거 (invalidateTags가 refetch 전 UI 업데이트)
      dispatch(removeChatRoomFromList(chatRoomId));
      if (showToast) {
        showToast('채팅방을 나갔습니다.');
      }
      navigation.goBack();
    })
    .catch(err => {
      console.error('❌ 나가기 실패:', err);
      if (showToast) {
        const msg =
          typeof err === 'string'
            ? err
            : '채팅방 나가기 중 문제가 발생했어요. 다시 시도해 주세요.';
        showToast(msg);
      }
    });
};
