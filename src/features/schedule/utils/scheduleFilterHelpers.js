const TYPE = {
  INDIVIDUAL: 'INDIVIDUAL',
  FAMILY: 'FAMILY',
  ANNIVERSARY: 'ANNIVERSARY',
};

/**
 * 일정이 “사람 필터”에 포함되는지 (클라이언트).
 * - filterUserIds가 비어 있으면 전체
 * - 가족·기념일은 항상 포함
 * - 개인 일정은 participantIds / userId가 선택된 사람 중 한 명과 맞으면 포함 (OR)
 */
export function scheduleItemMatchesViewFilter(item, filterUserIds) {
  if (!filterUserIds || filterUserIds.length === 0) return true;

  const raw =
    item?.type ??
    item?.scheduleType ??
    item?.kind ??
    item?.category ??
    item?.eventType ??
    null;
  const t = String(raw || '').toUpperCase();

  const isAnniv =
    item?.isAnniversary === true ||
    t === TYPE.ANNIVERSARY ||
    t.includes('ANNIV') ||
    t.includes('ANNIVERSARY') ||
    String(raw || '')
      .toLowerCase()
      .includes('기념');

  const isFamily =
    !isAnniv &&
    (t === TYPE.FAMILY ||
      t.includes('FAMILY') ||
      item?.isShared === true ||
      item?.shared === true ||
      String(raw || '').toLowerCase().includes('공동'));

  if (isAnniv || isFamily) return true;

  const want = new Set(filterUserIds.map(x => String(x)));
  const fromParticipants = Array.isArray(item?.participantIds)
    ? item.participantIds.map(String)
    : item?.userId != null
    ? [String(item.userId)]
    : [];
  if (fromParticipants.some(id => want.has(id))) return true;
  if (item?.userId != null && want.has(String(item.userId))) return true;
  return false;
}

export function normalizeScheduleListResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.schedules)) return data.schedules;
  if (Array.isArray(data?.data?.schedules)) return data.data.schedules;
  return [];
}
