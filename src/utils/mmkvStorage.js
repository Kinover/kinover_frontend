// redux-persist storage adapter for react-native-mmkv
// - v4+: `createMMKV` 사용 (`new MMKV`는 더 이상 없음 — 실패 시 항상 메모리 폴백만 쓰여 재시작 후 유실됨)
// - Native module unavailable (e.g. Jest) 환경에서는 in-memory fallback 사용

let mmkv = null;
const memoryFallback = new Map();

try {
  const {createMMKV} = require('react-native-mmkv');
  if (typeof createMMKV === 'function') {
    mmkv = createMMKV({
      id: 'kinover-redux-persist',
    });
  }
} catch {
  mmkv = null;
}

const storage = {
  setItem: (key, value) => {
    if (mmkv) {
      mmkv.set(key, String(value));
    } else {
      memoryFallback.set(key, String(value));
    }
    return Promise.resolve(true);
  },

  getItem: key => {
    if (mmkv) {
      const value = mmkv.getString(key);
      return Promise.resolve(value ?? null);
    }
    return Promise.resolve(memoryFallback.get(key) ?? null);
  },

  removeItem: key => {
    if (mmkv) {
      try {
        mmkv.remove(key);
      } catch {
        null;
      }
    } else {
      memoryFallback.delete(key);
    }
    return Promise.resolve();
  },

  getAllKeys: () => {
    if (mmkv) {
      return Promise.resolve(mmkv.getAllKeys());
    }
    return Promise.resolve(Array.from(memoryFallback.keys()));
  },

  multiRemove: keys => {
    if (!Array.isArray(keys) || keys.length === 0) {
      return Promise.resolve();
    }

    if (mmkv) {
      keys.forEach(k => {
        try {
          mmkv.remove(k);
        } catch {
          null;
        }
      });
    } else {
      keys.forEach(key => memoryFallback.delete(key));
    }
    return Promise.resolve();
  },
};

/**
 * 라우팅 등 동기 일관성이 필요할 때만 사용 (MMKV set 직후 리렌더 타이밍용)
 */
export function mmkvGetStringSync(key) {
  if (mmkv) {
    const v = mmkv.getString(key);
    return v !== undefined && v !== null ? v : null;
  }
  const fromMemory = memoryFallback.get(key);
  return fromMemory !== undefined && fromMemory !== null
    ? String(fromMemory)
    : null;
}

/** setItem과 동일한 저장소에 동기 기록 (dismiss 직후 읽기 일관성) */
export function mmkvSetStringSync(key, value) {
  if (mmkv) {
    mmkv.set(key, String(value));
  } else {
    memoryFallback.set(key, String(value));
  }
}

export default storage;
