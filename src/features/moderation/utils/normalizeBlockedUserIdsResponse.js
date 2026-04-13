/**
 * GET /api/blocks — Authorization: Bearer 필수.
 * 응답 본문은 number 배열만 온다고 계약함. 예: [1, 2, 3]
 * ({ blockedUserIds } 등 객체 래핑 없음)
 *
 * 비정상 응답은 [] 로 처리.
 * @param {unknown} data
 * @returns {number[]}
 */
export function normalizeBlockedUserIdsFromApiResponse(data) {
  if (!Array.isArray(data)) {
    return [];
  }
  return [...new Set(data.map(Number).filter(Number.isFinite))];
}
