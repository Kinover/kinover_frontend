// redux-persist storage adapter for react-native-mmkv
// - Native module unavailable (e.g. Jest) 환경에서는 in-memory fallback 사용

let mmkv = null;
const memoryFallback = new Map();

try {
  const {MMKV} = require('react-native-mmkv');
  mmkv = new MMKV({
    id: 'kinover-redux-persist',
  });
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
      mmkv.delete(key);
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
      keys.forEach(key => mmkv.delete(key));
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
