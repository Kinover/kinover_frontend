import * as Keychain from 'react-native-keychain';
import {emitAuthFlagsChanged} from 'utils/authFlagsEvent';
import mmkvStorage from 'utils/mmkvStorage';

const HAS_FAMILY_KEY = 'hasFamily';
const GUEST_MODE_KEY = 'isGuestMode';
const NEEDS_SIGNUP_KEY = 'needsSignup';
const ACCESS_TOKEN_KEY = '@kinover/auth/accessToken';
const STORAGE_BOOTSTRAP_KEY = '@kinover/storage/bootstrap_v1';

export const ensureStorageDefaultsOnce = async () => {
  try {
    const bootstrapped = await mmkvStorage.getItem(STORAGE_BOOTSTRAP_KEY);
    if (bootstrapped === '1') return;

    const [needsSignup, guestMode] = await Promise.all([
      mmkvStorage.getItem(NEEDS_SIGNUP_KEY),
      mmkvStorage.getItem(GUEST_MODE_KEY),
    ]);

    if (needsSignup == null) {
      await mmkvStorage.setItem(NEEDS_SIGNUP_KEY, JSON.stringify(false));
    }
    if (guestMode == null) {
      await mmkvStorage.setItem(GUEST_MODE_KEY, JSON.stringify(false));
    }

    await mmkvStorage.setItem(STORAGE_BOOTSTRAP_KEY, '1');
  } catch (error) {
    null;
  }
};

export const setNeedsSignup = async needsSignup => {
  try {
    await mmkvStorage.setItem(NEEDS_SIGNUP_KEY, JSON.stringify(!!needsSignup));
    emitAuthFlagsChanged();
  } catch (error) {
    null;
  }
};

export const getNeedsSignup = async () => {
  try {
    const value = await mmkvStorage.getItem(NEEDS_SIGNUP_KEY);
    return value != null ? JSON.parse(value) : false;
  } catch (error) {
    return false;
  }
};

// A 방식: 로그인 세션 저장은 "토큰 중심"으로!
// hasFamily는 여기서 저장하지 말고, 로그인 성공 후 fetchUser로 확정해서 setHasFamily로 저장
export const saveLoginSession = async ({token, needsSignup}) => {
  if (typeof token !== 'string' || token.trim() === '') {
    return;
  }

  try {
    await Keychain.setGenericPassword('jwtToken', token, {
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch (error) {
    null;
  }

  try {
    await mmkvStorage.setItem(ACCESS_TOKEN_KEY, token);
    if (typeof needsSignup === 'boolean') {
      await mmkvStorage.setItem(
        NEEDS_SIGNUP_KEY,
        JSON.stringify(!!needsSignup),
      );
    }
    emitAuthFlagsChanged();
  } catch (error) {
    null;
  }
};

export const saveToken = async token => {
  if (typeof token !== 'string' || token.trim() === '') {
    return;
  }

  try {
    await Keychain.setGenericPassword('jwtToken', token, {
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch (error) {
    null;
  }

  try {
    await mmkvStorage.setItem(ACCESS_TOKEN_KEY, token);
  } catch (error) {
    null;
  }
};

export const setHasFamily = async hasFamily => {
  try {
    await mmkvStorage.setItem(HAS_FAMILY_KEY, JSON.stringify(hasFamily));
    emitAuthFlagsChanged();
  } catch (error) {
    null;
  }
};

export const getHasFamily = async () => {
  try {
    const value = await mmkvStorage.getItem(HAS_FAMILY_KEY);
    return value != null ? JSON.parse(value) : null;
  } catch (error) {
    return null;
  }
};

export const getToken = async () => {
  try {
    const [keychainResult, mmkvResult] = await Promise.allSettled([
      Keychain.getGenericPassword(),
      mmkvStorage.getItem(ACCESS_TOKEN_KEY),
    ]);

    const keychainToken =
      keychainResult.status === 'fulfilled'
        ? keychainResult.value?.password ?? null
        : null;
    if (keychainToken) return keychainToken;

    const mmkvToken =
      mmkvResult.status === 'fulfilled' ? mmkvResult.value ?? null : null;
    return mmkvToken;
  } catch (error) {
    try {
      const mmkvToken = await mmkvStorage.getItem(ACCESS_TOKEN_KEY);
      return mmkvToken ?? null;
    } catch (fallbackError) {
      return null;
    }
  }
};

export const deleteLoginInfo = async () => {
  try {
    await Keychain.resetGenericPassword();
    await mmkvStorage.removeItem(ACCESS_TOKEN_KEY);
    await mmkvStorage.removeItem(HAS_FAMILY_KEY);
    await mmkvStorage.removeItem(NEEDS_SIGNUP_KEY);
    emitAuthFlagsChanged();
  } catch (error) {
    null;
  }
};

// Guest Mode는 그대로 두되, enableGuestMode()가 deleteLoginInfo()를 호출하니 emit은 자동으로 됨
export const setGuestMode = async isGuestMode => {
  try {
    await mmkvStorage.setItem(GUEST_MODE_KEY, JSON.stringify(!!isGuestMode));
  } catch (error) {
    null;
  }
};

export const getGuestMode = async () => {
  try {
    const value = await mmkvStorage.getItem(GUEST_MODE_KEY);
    return value != null ? JSON.parse(value) : false;
  } catch (error) {
    return false;
  }
};

export const enableGuestMode = async () => {
  try {
    await deleteLoginInfo();
    await mmkvStorage.setItem(GUEST_MODE_KEY, JSON.stringify(true));
  } catch (error) {    null;
  }
};

export const disableGuestMode = async () => {
  try {
    await mmkvStorage.setItem(GUEST_MODE_KEY, JSON.stringify(false));
  } catch (error) {
    null;
  }
};

export const toggleGuestMode = async () => {
  try {
    const cur = await getGuestMode();
    const next = !cur;

    if (next) await enableGuestMode();
    else await disableGuestMode();

    return next;
  } catch (error) {
    return false;
  }
};
