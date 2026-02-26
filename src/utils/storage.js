import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {emitAuthFlagsChanged} from 'utils/authFlagsEvent';

const HAS_FAMILY_KEY = 'hasFamily';
const GUEST_MODE_KEY = 'isGuestMode';
const NEEDS_SIGNUP_KEY = 'needsSignup';

export const setNeedsSignup = async needsSignup => {
  try {
    await AsyncStorage.setItem(NEEDS_SIGNUP_KEY, JSON.stringify(!!needsSignup));
    console.log('needsSignup 상태 업데이트 완료:', !!needsSignup);
    emitAuthFlagsChanged();
  } catch (error) {
    console.error('needsSignup 업데이트 실패:', error);
  }
};

export const getNeedsSignup = async () => {
  try {
    const value = await AsyncStorage.getItem(NEEDS_SIGNUP_KEY);
    return value != null ? JSON.parse(value) : false;
  } catch (error) {
    console.error('needsSignup 불러오기 실패:', error);
    return false;
  }
};

// A 방식: 로그인 세션 저장은 "토큰 중심"으로!
// hasFamily는 여기서 저장하지 말고, 로그인 성공 후 fetchUser로 확정해서 setHasFamily로 저장
export const saveLoginSession = async ({token, needsSignup}) => {
  try {
    if (typeof token !== 'string') {
      console.error('토큰은 문자열이어야 합니다.');
      return;
    }

    await Keychain.setGenericPassword('jwtToken', token);

    if (typeof needsSignup === 'boolean') {
      await AsyncStorage.setItem(NEEDS_SIGNUP_KEY, JSON.stringify(!!needsSignup));
    }

    console.log('로그인 세션 저장 완료(A):', {needsSignup});
    emitAuthFlagsChanged();
  } catch (error) {
    console.error('로그인 세션 저장 실패:', error);
  }
};

export const saveToken = async token => {
  try {
    if (typeof token === 'string') {
      await Keychain.setGenericPassword('jwtToken', token);
      console.log('토큰 저장 완료');
    } else {
      console.error('토큰은 문자열이어야 합니다.');
    }
  } catch (error) {
    console.error('로그인 정보 저장 실패:', error);
  }
};

export const setHasFamily = async hasFamily => {
  try {
    await AsyncStorage.setItem(HAS_FAMILY_KEY, JSON.stringify(hasFamily));
    console.log('hasFamily 상태 업데이트 완료:', hasFamily);
    emitAuthFlagsChanged();
  } catch (error) {
    console.error('hasFamily 업데이트 실패:', error);
  }
};

export const getHasFamily = async () => {
  try {
    const value = await AsyncStorage.getItem(HAS_FAMILY_KEY);
    return value != null ? JSON.parse(value) : null;
  } catch (error) {
    console.error('hasFamily 불러오기 실패:', error);
    return null;
  }
};

export const getToken = async () => {
  try {
    const credentials = await Keychain.getGenericPassword();
    return credentials?.password ?? null;
  } catch (error) {
    console.error('토큰 불러오기 실패:', error);
    return null;
  }
};

export const deleteLoginInfo = async () => {
  try {
    await Keychain.resetGenericPassword();
    await AsyncStorage.removeItem(HAS_FAMILY_KEY);
    await AsyncStorage.removeItem(NEEDS_SIGNUP_KEY);
    console.log('로그인 정보 삭제 완료');
    emitAuthFlagsChanged();
  } catch (error) {
    console.error('로그인 정보 삭제 실패:', error);
  }
};

// Guest Mode는 그대로 두되, enableGuestMode()가 deleteLoginInfo()를 호출하니 emit은 자동으로 됨
export const setGuestMode = async isGuestMode => {
  try {
    await AsyncStorage.setItem(GUEST_MODE_KEY, JSON.stringify(!!isGuestMode));
    console.log('게스트 모드 상태 업데이트 완료:', !!isGuestMode);
  } catch (error) {
    console.error('게스트 모드 업데이트 실패:', error);
  }
};

export const getGuestMode = async () => {
  try {
    const value = await AsyncStorage.getItem(GUEST_MODE_KEY);
    return value != null ? JSON.parse(value) : false;
  } catch (error) {
    console.error('게스트 모드 불러오기 실패:', error);
    return false;
  }
};

export const enableGuestMode = async () => {
  try {
    await deleteLoginInfo();
    await AsyncStorage.setItem(GUEST_MODE_KEY, JSON.stringify(true));
    console.log('게스트 모드 ON 완료');
  } catch (error) {
    console.error('게스트 모드 ON 실패:', error);
  }
};

export const disableGuestMode = async () => {
  try {
    await AsyncStorage.setItem(GUEST_MODE_KEY, JSON.stringify(false));
    console.log('게스트 모드 OFF 완료');
  } catch (error) {
    console.error('게스트 모드 OFF 실패:', error);
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
    console.error('게스트 모드 토글 실패:', error);
    return false;
  }
};
