import ReactNativeBiometrics from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics();

export async function checkAndAuthBiometric() {
  const {available, biometryType} = await rnBiometrics.isSensorAvailable();

  if (!available) {
    return {success: false, reason: 'NOT_AVAILABLE'};
  }

  try {
    const result = await rnBiometrics.simplePrompt({
      promptMessage: '본인 인증이 필요해요',
      cancelButtonText: '취소',
    });

    return {
      success: result.success === true,
      biometryType,
    };
  } catch (e) {
    return {success: false, reason: 'CANCEL_OR_FAIL'};
  }
}

export async function getBiometricAvailability() {
  try {
    const {available, biometryType} = await rnBiometrics.isSensorAvailable();
    return {available: !!available, biometryType: biometryType || null};
  } catch (e) {
    return {available: false, biometryType: null};
  }
}
