/**
 * @param {number[]} ids
 * @returns {Set<number>}
 */
export function blockedIdSetFromStateIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    return new Set();
  }
  return new Set(ids.map(Number).filter(Number.isFinite));
}

/**
 * @param {Set<number>} blockedSet
 * @param {unknown} rawAuthorId
 */
export function isAuthorBlocked(blockedSet, rawAuthorId) {
  if (!blockedSet?.size) return false;
  const n = Number(rawAuthorId);
  if (!Number.isFinite(n)) return false;
  return blockedSet.has(n);
}

/**
 * 1:1(또는 내 제외 참가자가 전원 차단)인 방만 목록에서 숨김. 가족 단톡 등은 유지.
 */
export function shouldHideChatRoomForBlockedUsers(room, myUserId, blockedSet) {
  if (!room || room.kino) return false;
  if (!blockedSet?.size || myUserId == null) return false;

  const ucs = room.userChatRooms;
  if (!Array.isArray(ucs) || ucs.length === 0) return false;

  const me = String(myUserId);
  const others = ucs
    .map(uc => uc?.userId)
    .filter(id => id != null && String(id) !== me);

  if (others.length === 0) return false;

  return others.every(oid => blockedSet.has(Number(oid)));
}
