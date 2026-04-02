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
};

export default storage;
