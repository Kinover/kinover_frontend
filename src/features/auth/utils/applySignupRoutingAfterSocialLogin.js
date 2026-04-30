import {
  setStoredPhoneVerificationPending,
  setNeedsSignup,
  completePhoneVerification,
  setPhoneVerifyThenFamily,
  clearPhoneVerifyThenFamily,
  clearSignupSkipProfileAfterTerms,
  SIGNUP_PROGRESS_STEP,
  getAuthRoutingMmkvSnapshotSync,
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

  // 이 기기에서 가입을 완료(signupProgressStep === 'finish')한 적이 없으면
  // 탈퇴 후 재가입 등 서버가 needsSignup:false를 잘못 내려줄 때도 약관부터 다시 진행.
  // 가입을 완료한 기존 유저(finish 기록 있음)는 AppFlow/Tabs로 정상 진입.
  const snap = getAuthRoutingMmkvSnapshotSync();
  if (snap.signupProgressStep !== SIGNUP_PROGRESS_STEP.FINISH) {
    await setNeedsSignup(true);
    completePhoneVerification(SIGNUP_PROGRESS_STEP.TERMS);
    emitAuthFlagsChanged();
  }
}
