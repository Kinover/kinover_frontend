// store/messageActions.js
import {chatApi} from '../services/chatApi';
import {upsertMessageDraft} from './messageUtils';
import {applyMessagePreview, bumpListRevision} from '../store/chatRoomSlice';

const buildPreviewPayload = (msg, fallbackText = '') => {
  const type = String(msg?.messageType ?? msg?.type ?? 'text').toLowerCase();
  const createdAt = msg?.createdAt ?? new Date().toISOString();

  let content = msg?.content ?? fallbackText ?? '';
  if (type === 'image') content = content?.trim() ? content : '사진을 보냈어요';

  return {
    ...msg,
    messageType: type,
    createdAt,
    content,
  };
};

/**
 * 메시지 추가 + 채팅방 리스트 미리보기 갱신을 한 번에
 * - optimistic/서버 echo/상대 메시지 모두 여기로 넣으면 리스트가 항상 최신화됨
 */
export const addMessageAndUpdateRoom =
  ({chatRoomId, message, currentUserId}) =>
  dispatch => {
    const rid = String(chatRoomId);
    dispatch(
      chatApi.util.updateQueryData('getMessages', {chatRoomId: rid}, draft => {
        upsertMessageDraft(draft, message);
      }),
    );

    const preview = buildPreviewPayload(message);
    if (!preview) return;

    const senderId =
      preview.senderId ?? preview.senderID ?? preview.userId ?? preview.sender?.id;

    const isSelf =
      currentUserId != null && senderId != null
        ? String(senderId) === String(currentUserId)
        : false;

    dispatch(
      applyMessagePreview({
        chatRoomId: rid,
        message: preview,
        isSelf,
      }),
    );

    dispatch(bumpListRevision());
  };
