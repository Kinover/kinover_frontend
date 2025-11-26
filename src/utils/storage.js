// ✅ utils/storage.js

import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 토큰 + hasFamily 저장
export const saveToken = async (token) => {
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

// 🔹 hasFamily만 따로 저장하고 싶을 때
export const setHasFamily = async hasFamily => {
  try {
    await AsyncStorage.setItem('hasFamily', JSON.stringify(hasFamily));
    console.log('hasFamily 상태 업데이트 완료:', hasFamily);
  } catch (error) {
    console.error('hasFamily 업데이트 실패:', error);
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

export const getHasFamily = async () => {
  try {
    const value = await AsyncStorage.getItem('hasFamily');
    return JSON.parse(value);
  } catch (error) {
    console.error('hasFamily 불러오기 실패:', error);
    return null;
  }
};

export const deleteLoginInfo = async () => {
  try {
    await Keychain.resetGenericPassword();
    await AsyncStorage.removeItem('hasFamily');
    console.log('로그인 정보 삭제 완료');
  } catch (error) {
    console.error('로그인 정보 삭제 실패:', error);
  }
};
