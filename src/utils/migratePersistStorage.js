import AsyncStorage from '@react-native-async-storage/async-storage';
import mmkvStorage from './mmkvStorage';

const LEGACY_PERSIST_ROOT_KEY = 'persist:root';
const MMKV_MIGRATION_DONE_KEY = 'persist:migrated:mmkv:v1';

export async function migratePersistStorageIfNeeded() {
  try {
    const alreadyMigrated = await mmkvStorage.getItem(MMKV_MIGRATION_DONE_KEY);
    if (alreadyMigrated === '1') {
      return;
    }

    const mmkvPersistRoot = await mmkvStorage.getItem(LEGACY_PERSIST_ROOT_KEY);
    const asyncPersistRoot = await AsyncStorage.getItem(LEGACY_PERSIST_ROOT_KEY);

    if (!mmkvPersistRoot && asyncPersistRoot) {
      await mmkvStorage.setItem(LEGACY_PERSIST_ROOT_KEY, asyncPersistRoot);
    }

    const asyncKeys = await AsyncStorage.getAllKeys();
    const legacyPersistKeys = asyncKeys.filter(key => key.startsWith('persist:'));

    if (legacyPersistKeys.length > 0) {
      await AsyncStorage.multiRemove(legacyPersistKeys);
    }

    await mmkvStorage.setItem(MMKV_MIGRATION_DONE_KEY, '1');
  } catch (error) {
    // 마이그레이션 실패 시에도 앱 기동을 막지 않음
    console.log('[persist-migration] skipped:', error?.message);
  }
}
