import mmkvStorage, {mmkvGetStringSync} from 'utils/mmkvStorage';

const KEY = 'kinover:localBlockedUserIds';

function parseIds(raw) {
  if (!raw || typeof raw !== 'string') return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .map(v => Number(v))
      .filter(n => Number.isFinite(n));
  } catch {
    return [];
  }
}

export async function getLocalBlockedUserIds() {
  const raw = await mmkvStorage.getItem(KEY);
  return parseIds(raw);
}

/** Redux·렌더 동기 판별용 (MMKV 직접 읽기) */
export function getLocalBlockedUserIdsSync() {
  return parseIds(mmkvGetStringSync(KEY));
}

export async function setLocalBlockedUserIds(ids) {
  const unique = [
    ...new Set(
      ids
        .map(v => Number(v))
        .filter(n => Number.isFinite(n)),
    ),
  ];
  await mmkvStorage.setItem(KEY, JSON.stringify(unique));
}

export async function addLocalBlockedUserId(userId) {
  const n = Number(userId);
  if (!Number.isFinite(n)) return;
  const cur = await getLocalBlockedUserIds();
  if (cur.includes(n)) return;
  await setLocalBlockedUserIds([...cur, n]);
}

export async function removeLocalBlockedUserId(userId) {
  const n = Number(userId);
  if (!Number.isFinite(n)) return;
  const cur = await getLocalBlockedUserIds();
  await setLocalBlockedUserIds(cur.filter(id => id !== n));
}
