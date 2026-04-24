import {
  setStoredPhoneVerificationPending,
  setNeedsSignup,
  completePhoneVerification,
  setPhoneVerifyThenFamily,
  clearPhoneVerifyThenFamily,
  clearSignupSkipProfileAfterTerms,
  SIGNUP_PROGRESS_STEP,
} from 'utils/storage';
import {emitAuthFlagsChanged} from 'utils/authFlagsEvent';
import {setPhoneVerificationPending} from '../store/loginSlice';

/**
 * 카카오·애플 등 소셜 로그인 성공 후:
 * 가입 필요 시 항상 약관 화면부터 (약관 → 전화 → 가족) MMKV 정렬
 */
export async function applySignupRoutingAfterSocialLogin(loginResult, dispatch) {
  const hasFamily = !!loginResult?.hasFamily;
  const needsSignup = !!loginResult?.needsSignup;
  const phoneVerified = loginResult?.phoneVerified;

  if (hasFamily) {
    clearPhoneVerifyThenFamily();
    clearSignupSkipProfileAfterTerms();
    return;
  }

  if (needsSignup) {
    await setNeedsSignup(true);
    clearPhoneVerifyThenFamily();
    completePhoneVerification(SIGNUP_PROGRESS_STEP.TERMS);
    emitAuthFlagsChanged();
    return;
  }

  if (phoneVerified === false) {
    await setPhoneVerifyThenFamily(true);
    await setStoredPhoneVerificationPending(true);
    dispatch(setPhoneVerificationPending());
    return;
  }

  clearPhoneVerifyThenFamily();
  await setNeedsSignup(true);
  completePhoneVerification(SIGNUP_PROGRESS_STEP.TERMS);
  emitAuthFlagsChanged();
}
