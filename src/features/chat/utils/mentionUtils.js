export function escapeRegExp(str) {
  return String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function findActiveMentionQuery(text, cursor) {
  const before = (text || '').slice(0, cursor);
  const match = before.match(/(^|\s)@([^\s@]{0,20})$/);
  if (!match) return null;

  const query = match[2] ?? '';
  const atIndex = before.lastIndexOf('@');
  if (atIndex < 0) return null;

  return {query, atIndex};
}

export function applyMention(text, atIndex, cursor, name) {
  const beforeAt = (text || '').slice(0, atIndex);
  const afterToken = (text || '').slice(cursor);
  const next = `${beforeAt}@${name} ${afterToken}`;
  const nextCursor = (beforeAt + `@${name} `).length;
  return {next, nextCursor};
}

export function extractMentionUserIds(text, users) {
  if (!text?.trim() || !Array.isArray(users) || users.length === 0) return [];

  const ids = new Set();
  for (const u of users) {
    if (!u?.name || u?.userId == null) continue;

    const re = new RegExp(
      `(^|\\s)@${escapeRegExp(u.name)}(?=\\s|$|[.,!?…])`,
      'g',
    );
    if (re.test(text)) ids.add(String(u.userId));
  }
  return Array.from(ids);
}
