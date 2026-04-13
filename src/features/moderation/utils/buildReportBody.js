/**
 * POST /api/reports 요청 본문 (백엔드 CreateReportRequest)
 * @param {{ targetType: string, targetUuid?: string, targetUserId?: number }} ctx
 * @param {string} reasonCode
 */
export function buildCreateReportBody(ctx, reasonCode) {
  const targetType = String(ctx?.targetType ?? '').trim();
  if (!targetType) {
    throw new Error('targetType missing');
  }
  const code = String(reasonCode ?? '').trim();
  if (!code) {
    throw new Error('reasonCode missing');
  }

  if (targetType === 'USER') {
    const id = Number(ctx?.targetUserId);
    if (!Number.isFinite(id)) {
      throw new Error('targetUserId invalid');
    }
    return {targetType, targetUserId: id, reasonCode: code};
  }

  const uuid = String(ctx?.targetUuid ?? '').trim();
  if (!uuid) {
    throw new Error('targetUuid missing');
  }
  return {targetType, targetUuid: uuid, reasonCode: code};
}

/** DTO에 uuid 필드가 없을 때 문자열 id로 폴백 */
export function pickTargetUuid(entity, fallbackKeys = ['uuid', 'postUuid', 'commentUuid', 'messageUuid', 'scheduleUuid']) {
  if (!entity || typeof entity !== 'object') return '';
  for (const k of fallbackKeys) {
    const v = entity[k];
    if (v != null && String(v).trim() !== '') {
      return String(v).trim();
    }
  }
  return '';
}
