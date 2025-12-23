// src/utils/mentions.js
export function escapeRegExp(str) {
    return String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  /**
   * 텍스트에서 "@이름"을 찾아서 userId 리스트로 반환
   * - users 기준으로만 매칭(오타 @xxx 는 무시)
   * - 중복 언급은 1번만 반환
   */
  export function extractMentionUserIds(text, users) {
    if (!text?.trim() || !Array.isArray(users) || users.length === 0) return [];
  
    const ids = new Set();
    for (const u of users) {
      if (!u?.name) continue;
      const re = new RegExp(
        `(^|\\s)@${escapeRegExp(u.name)}(?=\\s|$|[.,!?…])`,
        'g',
      );
      if (re.test(text)) ids.add(String(u.userId));
    }
    return Array.from(ids);
  }
  
  /**
   * 커서 앞에서 마지막 "@토큰"을 감지
   * - "@은" 처럼 입력 중인 상태면 {query:"은", atIndex:...} 반환
   * - 이메일(abc@def)은 최대한 배제(공백/줄 시작 뒤의 @만 인정)
   */
  export function findActiveMentionQuery(text, cursor) {
    const before = (text || '').slice(0, cursor);
    const match = before.match(/(^|\s)@([^\s@]{0,20})$/);
    if (!match) return null;
  
    const query = match[2] ?? '';
    const atIndex = before.lastIndexOf('@');
    if (atIndex < 0) return null;
  
    return {query, atIndex};
  }
  
  /**
   * "@쿼리" 부분을 "@이름 " 으로 치환
   */
  export function applyMention(text, atIndex, cursor, name) {
    const beforeAt = (text || '').slice(0, atIndex);
    const afterToken = (text || '').slice(cursor);
    const next = `${beforeAt}@${name} ${afterToken}`;
    const nextCursor = (beforeAt + `@${name} `).length;
    return {next, nextCursor};
  }
  