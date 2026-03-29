import ReactNativeBiometrics from 'react-native-biometrics';

const rnBiometricOnly = new ReactNativeBiometrics({allowDeviceCredentials: false});
const rnWithDevice = new ReactNativeBiometrics({allowDeviceCredentials: true});

const CANCEL = '취소';

function promptWithDevice(promptMessage, fallbackPromptMessage) {
  return rnWithDevice.simplePrompt({
    promptMessage,
    cancelButtonText: CANCEL,
    fallbackPromptMessage: fallbackPromptMessage || '기기 암호로 인증',
  });
}

function promptBiometricOnly(promptMessage) {
  return rnBiometricOnly.simplePrompt({
    promptMessage,
    cancelButtonText: CANCEL,
  });
}

async function tryBiometricOnce(message) {
  try {
    const r = await promptBiometricOnly(message);
    return !!r.success;
  } catch (e) {
    return false;
  }
}

export async function checkAndAuthBiometric() {
  const {available, biometryType} = await rnWithDevice.isSensorAvailable();

  if (!available) {
    return {success: false, reason: 'NOT_AVAILABLE'};
  }

  try {
    const result = await promptWithDevice('본인 인증이 필요해요');
    if (result.success) {
      return {success: true, biometryType};
    }
    return {success: false, reason: 'CANCEL_OR_FAIL'};
  } catch (e) {
    return {success: false, reason: 'CANCEL_OR_FAIL'};
  }
}

/**
 * 앱 잠금: 생체 2회 → 기기 암호(PIN/패턴 등) → 모두 실패 시 호출부에서 로그아웃
 * 생체 미등록이면 기기 암호만 시도
 */
export async function checkAndAuthBiometricAppLock() {
  const bioAvail = await rnBiometricOnly.isSensorAvailable();
  const deviceAvail = await rnWithDevice.isSensorAvailable();

  if (!deviceAvail?.available) {
    return {success: false, reason: 'NOT_AVAILABLE'};
  }

  if (!bioAvail?.available) {
    try {
      const result = await promptWithDevice('기기 암호로 인증해 주세요');
      if (result.success) {
        return {success: true, biometryType: deviceAvail.biometryType || null};
      }
      return {success: false, requireLogout: true};
    } catch (e) {
      return {success: false, requireLogout: true};
    }
  }

  const ok1 = await tryBiometricOnce('본인 인증이 필요해요');
  if (ok1) {
    return {success: true, biometryType: bioAvail.biometryType};
  }

  const ok2 = await tryBiometricOnce('다시 한 번 생체 인증을 해 주세요');
  if (ok2) {
    return {success: true, biometryType: bioAvail.biometryType};
  }

  try {
    const result = await promptWithDevice('기기 암호로 인증해 주세요');
    if (result.success) {
      return {success: true, biometryType: bioAvail.biometryType};
    }
    return {success: false, requireLogout: true};
  } catch (e) {
    return {success: false, requireLogout: true};
  }
}

export async function getBiometricAvailability() {
  try {
    const {available, biometryType} = await rnWithDevice.isSensorAvailable();
    return {available: !!available, biometryType: biometryType || null};
  } catch (e) {
    return {available: false, biometryType: null};
  }
}
