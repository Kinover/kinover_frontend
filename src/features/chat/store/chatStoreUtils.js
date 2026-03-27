// src/features/chat/store/chatStoreUtils.js
// 채팅 store 전반에서 공통으로 쓰는 순수 유틸 함수 모음

/**
 * null/undefined를 null로, 그 외는 String으로 변환
 */
export const toId = v => (v == null ? null : String(v));

/**
 * 임의의 날짜 값을 ISO string으로 정규화
 * 잘못된 날짜면 현재 시각 ISO를 반환
 */
export const toIso = d => {
  try {
    const t = d ? new Date(d) : new Date();
    if (Number.isNaN(t.getTime())) return new Date().toISOString();
    return t.toISOString();
  } catch {
    return new Date().toISOString();
  }
};

/**
 * 채팅방 목록을 최신 메시지 시각 기준 내림차순 정렬
 */
export const sortByLatest = list =>
  [...list].sort(
    (a, b) =>
      new Date(b.latestMessageTime || 0).getTime() -
      new Date(a.latestMessageTime || 0).getTime(),
  );

/**
 * 메시지 타입에 따른 미리보기 텍스트
 */
export const previewText = msg => {
  if (!msg) return '';
  const type = msg.messageType?.toLowerCase?.();
  const n = Array.isArray(msg.imageUrls)
    ? msg.imageUrls.length
    : Array.isArray(msg.mediaUrls)
    ? msg.mediaUrls.length
    : 1;
  if (type === 'image') return `사진을 ${n}장 보냈습니다.`;
  if (type === 'video') return `동영상을 ${n}개 보냈습니다.`;
  if (type === 'file') return '[파일]';
  return msg.content ?? '';
};

/**
 * state.chatRoomList 에서 chatRoomId로 인덱스 탐색
 */
export const findRoomIndex = (state, rid) =>
  (state?.chatRoomList ?? []).findIndex(r => toId(r?.chatRoomId) === rid);

/**
 * chatRoomList를 최신순 정렬하고 listRevision 증가
 */
export const finalizeList = state => {
  const list = state?.chatRoomList ?? [];
  state.chatRoomList = Array.isArray(list) ? sortByLatest(list) : [];
  state.listRevision = (state.listRevision ?? 0) + 1;
};
