import {
  setStoredPhoneVerificationPending,
  setNeedsSignup,
  completePhoneVerification,
  setPhoneVerifyThenFamily,
  clearPhoneVerifyThenFamily,
  clearSignupSkipProfileAfterTerms,
  consumeForceTermsNextLoginSync,
  SIGNUP_PROGRESS_STEP,
} from 'utils/storage';
import {emitAuthFlagsChanged} from 'utils/authFlagsEvent';
import {setPhoneVerificationPending} from '../store/loginSlice';

/**
 * 카카오·애플 등 소셜 로그인 성공 후:
 * 가입 필요 시 항상 약관 화면부터 (약관 → 전화 → 가족) MMKV 정렬
 */
export async function applySignupRoutingAfterSocialLogin(loginResult, dispatch) {
  // 탈퇴 직후 재가입은 서버 응답이 흔들려도 항상 약관부터 시작
  if (consumeForceTermsNextLoginSync()) {
    await setNeedsSignup(true);
    clearPhoneVerifyThenFamily();
    completePhoneVerification(SIGNUP_PROGRESS_STEP.TERMS);
    emitAuthFlagsChanged();
    return;
  }

  const hasFamily = !!loginResult?.hasFamily;
  const needsSignup = !!loginResult?.needsSignup;
  const phoneVerified = loginResult?.phoneVerified;

  if (hasFamily) {
    clearPhoneVerifyThenFamily();
    clearSignupSkipProfileAfterTerms();
    return;
  }

  // 서버가 needsSignup=false를 내려준 기존 유저(가족 없음 포함)는
  // 로그아웃 후에도 온보딩/약관으로 되돌리지 않고 AppFlow 진입을 허용한다.
  // (디바이스 로컬 finish 기록은 로그아웃 시 삭제될 수 있어 SSOT로 쓰기 부적절)
  if (!needsSignup && phoneVerified !== false) {
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

  // phoneVerified=false는 위에서 처리되므로 여기서는 추가 라우팅 조작을 하지 않는다.
}
