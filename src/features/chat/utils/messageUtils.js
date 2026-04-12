// src/features/chat/utils/messageUtils.js
// 메시지 dedup/upsert 로직 (messageSlice + chatApi 공용)

const toStr = v => (v == null ? null : String(v));

const normalizeImageKey = v => {
  if (!v) return null;
  const s = String(v);
  const noQuery = s.split('?')[0];
  return noQuery.split('/').pop();
};

const arrayEqualLoose = (a, b) => {
  const A = (Array.isArray(a) ? a : a ? [a] : []).map(normalizeImageKey);
  const B = (Array.isArray(b) ? b : b ? [b] : []).map(normalizeImageKey);
  if (A.length !== B.length) return false;
  for (let i = 0; i < A.length; i++) if (A[i] !== B[i]) return false;
  return true;
};

const toMessageMs = v => {
  const s = String(v ?? '').trim().replace(' ', 'T');
  const t = new Date(s).getTime();
  return Number.isFinite(t) ? t : 0;
};

const messageSortKey = m =>
  String(m?.messageId ?? m?.clientMessageId ?? m?.createdAt ?? '');

const compareMessagesDesc = (a, b) => {
  const diff = toMessageMs(b?.createdAt) - toMessageMs(a?.createdAt);
  if (diff !== 0) return diff;
  return messageSortKey(b).localeCompare(messageSortKey(a));
};

/** optimistic 메시지(sending)와 서버 응답 메시지가 같은 것인지 휴리스틱 판별 */
export const looksLikeSameMyMessage = (optimistic, incoming) => {
  if (!optimistic || !incoming) return false;
  if (optimistic.localStatus !== 'sending') return false;

  const oSender = toStr(optimistic.senderId);
  const iSender = toStr(incoming.senderId);
  if (!oSender || !iSender || oSender !== iSender) return false;

  const oType = toStr(optimistic.messageType ?? optimistic.type ?? 'text')
    ?.toLowerCase()
    ?.trim();
  const iType = toStr(incoming.messageType ?? incoming.type ?? 'text')
    ?.toLowerCase()
    ?.trim();
  if (oType !== iType) return false;

  if (oType === 'text') {
    const oc = toStr(optimistic.content ?? '');
    const ic = toStr(incoming.content ?? '');
    if (!oc || !ic) return false;
    return oc === ic;
  }

  if (oType === 'image' || oType === 'video') {
    const oa =
      optimistic.imageUrls ?? optimistic.mediaUrls ?? optimistic.images ?? optimistic.videoUrls ?? [];
    const ia =
      incoming.imageUrls ?? incoming.mediaUrls ?? incoming.images ?? incoming.videoUrls ?? [];
    const oArr = Array.isArray(oa) ? oa : oa ? [oa] : [];
    const iArr = Array.isArray(ia) ? ia : ia ? [ia] : [];
    if (oArr.length === 0 || iArr.length === 0) return false;
    return arrayEqualLoose(oArr, iArr);
  }

  return false;
};

/**
 * 메시지 배열에서 중복 upsert
 * - clientMessageId 매칭 → messageId 매칭 → 휴리스틱 매칭 → 맨 앞에 추가
 * RTK Query updateQueryData 콜백의 draft 배열에도 그대로 사용 가능
 */
export const upsertMessageByIdOrClientId = (list, message) => {
  if (!message) return list;

  const type = toStr(message?.messageType ?? message?.type ?? 'text')?.toLowerCase()?.trim();
  const content = toStr(message?.content ?? '').trim();
  const media =
    message?.mediaUrls ?? message?.imageUrls ?? message?.videoUrls ??
    message?.images ?? message?.imageUrl ?? message?.videoUrl ?? [];
  const mediaArr = Array.isArray(media) ? media : media ? [media] : [];
  const hasMedia = mediaArr.length > 0;

  if (type === 'text' && !content) return list;
  if ((type === 'image' || type === 'video') && !hasMedia) return list;

  const msgId = toStr(message?.messageId);
  const clientId = toStr(message?.clientMessageId);

  if (clientId) {
    const idx = list.findIndex(m => toStr(m?.clientMessageId) === clientId);
    if (idx !== -1) {
      const next = [...list];
      next[idx] = message;
      return next;
    }
    const optimisticKey = `client-${clientId}`;
    const idx2 = list.findIndex(m => toStr(m?.messageId) === optimisticKey);
    if (idx2 !== -1) {
      const next = [...list];
      next[idx2] = message;
      return next;
    }
    const idx3 = list.findIndex(m => toStr(m?.messageId) === clientId);
    if (idx3 !== -1) {
      const next = [...list];
      next[idx3] = message;
      return next;
    }
  }

  if (msgId) {
    const idx = list.findIndex(m => toStr(m?.messageId) === msgId);
    if (idx !== -1) {
      const next = [...list];
      next[idx] = message;
      return next;
    }
  }

  const optimisticIdx = list.findIndex(m => looksLikeSameMyMessage(m, message));
  if (optimisticIdx !== -1) {
    const next = [...list];
    next[optimisticIdx] = message;
    return next;
  }

  return [message, ...list];
};

/**
 * Immer draft 배열에 메시지를 upsert (RTK Query updateQueryData 콜백용)
 * draft는 Immer proxy이므로 직접 변이(mutate) 해야 함
 */
export const upsertMessageDraft = (draft, message) => {
  if (!message) return;

  const type = toStr(message?.messageType ?? message?.type ?? 'text')?.toLowerCase()?.trim();
  const content = toStr(message?.content ?? '').trim();
  const media =
    message?.mediaUrls ?? message?.imageUrls ?? message?.videoUrls ??
    message?.images ?? message?.imageUrl ?? message?.videoUrl ?? [];
  const mediaArr = Array.isArray(media) ? media : media ? [media] : [];
  const hasMedia = mediaArr.length > 0;

  if (type === 'text' && !content) return;
  if ((type === 'image' || type === 'video') && !hasMedia) return;

  const msgId = toStr(message?.messageId);
  const clientId = toStr(message?.clientMessageId);

  // clientMessageId로 optimistic 메시지 찾기
  if (clientId) {
    const idx = draft.findIndex(m => toStr(m?.clientMessageId) === clientId);
    if (idx !== -1) {
      draft[idx] = message;
      draft.sort(compareMessagesDesc);
      return;
    }
    const optimisticKey = `client-${clientId}`;
    const idx2 = draft.findIndex(m => toStr(m?.messageId) === optimisticKey);
    if (idx2 !== -1) {
      draft[idx2] = message;
      draft.sort(compareMessagesDesc);
      return;
    }
    const idx3 = draft.findIndex(m => toStr(m?.messageId) === clientId);
    if (idx3 !== -1) {
      draft[idx3] = message;
      draft.sort(compareMessagesDesc);
      return;
    }
  }

  // messageId 중복 체크
  if (msgId) {
    const idx = draft.findIndex(m => toStr(m?.messageId) === msgId);
    if (idx !== -1) {
      draft[idx] = message;
      draft.sort(compareMessagesDesc);
      return;
    }
  }

  // 휴리스틱: 내 optimistic 메시지와 같은 것인지
  const optimisticIdx = draft.findIndex(m => looksLikeSameMyMessage(m, message));
  if (optimisticIdx !== -1) {
    draft[optimisticIdx] = message;
    draft.sort(compareMessagesDesc);
    return;
  }

  // 새 메시지: 맨 앞에 추가 (메시지 배열은 DESC 정렬)
  draft.unshift(message);
  draft.sort(compareMessagesDesc);
};
