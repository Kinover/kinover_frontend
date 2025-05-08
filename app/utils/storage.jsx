import * as Keychain from 'react-native-keychain';

// 토큰 저장
export const saveToken = async (token) => {
  try {
    // 토큰이 문자열인지 확인 후 저장
    if (typeof token === 'string') {
      await Keychain.setGenericPassword('jwtToken', token);
      console.log('토큰이 안전하게 저장되었습니다.', token);
    } else {
      console.error('토큰은 문자열이어야 합니다.');
    }
  } catch (error) {
    console.error('토큰 저장 실패:', error);
  }
};

// 토큰 불러오기
export const getToken = async () => {
  try {
    const credentials = await Keychain.getGenericPassword();
    if (credentials) {
      console.log('저장된 토큰:', credentials.password); // 정상적으로 토큰을 반환
      return credentials.password; // 비밀번호 값만 반환
    } else {
      console.log('저장된 토큰이 없습니다.');
      return null; // 토큰이 없으면 null 반환
    }
  } catch (error) {
    console.error('토큰 불러오기 실패:', error);
    return null; // 예외가 발생하면 null 반환
  }
};

// 토큰 삭제
export const deleteToken = async () => {
  try {
    await Keychain.resetGenericPassword();
    console.log('토큰이 삭제되었습니다.');
  } catch (error) {
    console.error('토큰 삭제 실패:', error);
  }
};
