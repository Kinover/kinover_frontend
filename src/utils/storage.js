import * as Keychain from 'react-native-keychain';
import {emitAuthFlagsChanged} from 'utils/authFlagsEvent';
import mmkvStorage, {mmkvGetStringSync, mmkvSetStringSync} from 'utils/mmkvStorage';

const HAS_FAMILY_KEY = 'hasFamily';
const LEGACY_GUEST_MODE_KEY = 'isGuestMode';
const NEEDS_SIGNUP_KEY = 'needsSignup';
const ACCESS_TOKEN_KEY = '@kinover/auth/accessToken';
const STORAGE_BOOTSTRAP_KEY = '@kinover/storage/bootstrap_v1';
/** 신규 가입 플로우 재진입용 (Redux login 슬라이스는 persist 안 함) */
const SIGNUP_PROGRESS_STEP_KEY = 'auth:signupProgressStep';
const PENDING_SIGNUP_TERMS_JSON_KEY = 'auth:pendingSignupTermsJson';
const PHONE_VERIFICATION_PENDING_STORAGE_KEY = 'auth:phoneVerificationPending';
/** 약관 후 전화 인증 단계 진입했음(단계 키 유실 시 약관으로 되돌리지 않기 위함) */
const SIGNUP_AWAITING_PHONE_KEY = 'auth:signupAwaitingPhone';
/** 가입 플로우에서 전화 인증을 반드시 거쳐야 함(전화 완료 전까지 약관/프로필로 우회 방지) */
const SIGNUP_REQUIRES_PHONE_KEY = 'auth:signupRequiresPhone';
/** 애플 로그인 직후: 전화 OTP 완료 시 약관/프로필 없이 가족 설정으로 보냄 */
const PHONE_VERIFY_THEN_FAMILY_KEY = 'auth:phoneVerifyThenFamily';
/** 소셜 가입(전화 먼저): 약관 후 유저정보(이름·생일) 화면 생략 */
const SIGNUP_SKIP_PROFILE_AFTER_TERMS_KEY = 'auth:signupSkipProfileAfterTerms';
/** 딥링크로 전달받은 가족 초대 코드 (가족설정화면에서 읽고 즉시 삭제) */
const PENDING_INVITE_CODE_KEY = 'invite:pendingCode';
/** 가족 설정 화면을 건너뛰고 앱에 진입했음 (가족 없이 탭 진입 허용) */
const FAMILY_SETUP_SKIPPED_KEY = 'auth:familySetupSkipped';
/** 나중에 하기로 설정완료 화면에 온 상태(시작하기 전). 라우트 params 유실 시에도 스킵 완료 분기 유지 */
const FAMILY_SKIP_PENDING_FINISH_KEY = 'auth:familySkipPendingFinish';
/** 탈퇴 직후 재가입: 다음 소셜 로그인에서 약관부터 강제(1회) */
const FORCE_TERMS_NEXT_LOGIN_KEY = 'auth:forceTermsNextLogin';

export const SIGNUP_PROGRESS_STEP = {
  PHONE: 'phone',
  TERMS: 'terms',
  PROFILE: 'profile',
  FAMILY: 'family',
  FINISH: 'finish',
};

export const ensureStorageDefaultsOnce = async () => {
  try {
    await mmkvStorage.removeItem(LEGACY_GUEST_MODE_KEY);
    const bootstrapped = await mmkvStorage.getItem(STORAGE_BOOTSTRAP_KEY);
    if (bootstrapped === '1') return;

    const needsSignup = await mmkvStorage.getItem(NEEDS_SIGNUP_KEY);

    if (needsSignup == null) {
      await mmkvStorage.setItem(NEEDS_SIGNUP_KEY, JSON.stringify(false));
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

export const getSignupProgressStep = async () => {
  try {
    const raw = await mmkvStorage.getItem(SIGNUP_PROGRESS_STEP_KEY);
    if (raw == null || String(raw).trim() === '') return null;
    return String(raw).trim();
  } catch {
    return null;
  }
};

export const setSignupProgressStep = async step => {
  try {
    if (step == null || step === '') {
      await mmkvStorage.removeItem(SIGNUP_PROGRESS_STEP_KEY);
    } else {
      await mmkvStorage.setItem(SIGNUP_PROGRESS_STEP_KEY, String(step));
    }
    emitAuthFlagsChanged();
  } catch {
    null;
  }
};

export const getPendingSignupTermsParams = async () => {
  try {
    const raw = await mmkvStorage.getItem(PENDING_SIGNUP_TERMS_JSON_KEY);
    if (raw == null || raw === '') return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

/**
 * RootScreen 라우팅용: MMKV를 동기로 읽어 set 직후 React state보다 앞서는 값을 쓴다.
 * (전화 인증 완료 직후 dispatch → 리렌더 시 이전 mmkv 캐시 state로 전화 화면에 고정되는 현상 방지)
 */
export function getAuthRoutingMmkvSnapshotSync() {
  try {
    const read = key => mmkvGetStringSync(key);

    const hasFamilyRaw = read(HAS_FAMILY_KEY);
    let hasFamily = null;
    if (hasFamilyRaw != null) {
      try {
        hasFamily = JSON.parse(hasFamilyRaw);
      } catch {
        hasFamily = null;
      }
    }

    const needsSignupRaw = read(NEEDS_SIGNUP_KEY);
    let needsSignup = false;
    if (needsSignupRaw != null) {
      try {
        needsSignup = !!JSON.parse(needsSignupRaw);
      } catch {
        needsSignup = false;
      }
    }

    const stepRaw = read(SIGNUP_PROGRESS_STEP_KEY);
    const signupProgressStep =
      stepRaw != null && String(stepRaw).trim() !== ''
        ? String(stepRaw).trim()
        : null;

    const phoneP = read(PHONE_VERIFICATION_PENDING_STORAGE_KEY);
    const mmkvPhoneVerificationPending =
      phoneP === '1' || phoneP === 'true';

    const awaitingRaw = read(SIGNUP_AWAITING_PHONE_KEY);
    const signupAwaitingPhone =
      awaitingRaw === '1' || awaitingRaw === 'true';

    const requiresRaw = read(SIGNUP_REQUIRES_PHONE_KEY);
    const signupRequiresPhone =
      requiresRaw === '1' || requiresRaw === 'true';

    const phoneVerifyThenFamilyRaw = read(PHONE_VERIFY_THEN_FAMILY_KEY);
    const phoneVerifyThenFamily =
      phoneVerifyThenFamilyRaw === '1' || phoneVerifyThenFamilyRaw === 'true';

    const skipProfileRaw = read(SIGNUP_SKIP_PROFILE_AFTER_TERMS_KEY);
    const signupSkipProfileAfterTerms =
      skipProfileRaw === '1' || skipProfileRaw === 'true';

    let hasPendingSignupTerms = false;
    const termsRaw = read(PENDING_SIGNUP_TERMS_JSON_KEY);
    if (termsRaw != null && termsRaw !== '') {
      try {
        const parsed = JSON.parse(termsRaw);
        hasPendingSignupTerms = !!(parsed && typeof parsed === 'object');
      } catch {
        hasPendingSignupTerms = false;
      }
    }

    const skippedRaw = read(FAMILY_SETUP_SKIPPED_KEY);
    const familySetupSkipped = skippedRaw === '1' || skippedRaw === 'true';

    const skipPendingRaw = read(FAMILY_SKIP_PENDING_FINISH_KEY);
    const familySkipPendingFinish =
      skipPendingRaw === '1' || skipPendingRaw === 'true';

    return {
      hasFamily,
      needsSignup,
      signupProgressStep,
      mmkvPhoneVerificationPending,
      signupAwaitingPhone,
      signupRequiresPhone,
      phoneVerifyThenFamily,
      signupSkipProfileAfterTerms,
      hasPendingSignupTerms,
      familySetupSkipped,
      familySkipPendingFinish,
    };
  } catch {
    return {
      hasFamily: null,
      needsSignup: false,
      signupProgressStep: null,
      mmkvPhoneVerificationPending: false,
      signupAwaitingPhone: false,
      signupRequiresPhone: false,
      phoneVerifyThenFamily: false,
      signupSkipProfileAfterTerms: false,
      hasPendingSignupTerms: false,
      familySetupSkipped: false,
      familySkipPendingFinish: false,
    };
  }
}

/** 가족 설정「나중에」→ 설정완료 화면 직전에 동기 기록 (AuthNavigator 리마운트 시 params 없어도 스킵 UI·시작하기 분기 유지) */
export function markFamilySkipFinishScreenPendingSync() {
  try {
    mmkvSetStringSync(FAMILY_SKIP_PENDING_FINISH_KEY, '1');
  } catch {
    null;
  }
}

/** 가족 코드 참여/생성으로 설정완료로 온 경우 스킵 대기 플래그 제거 */
export function clearFamilySkipFinishScreenPendingSync() {
  try {
    mmkvStorage.removeItem(FAMILY_SKIP_PENDING_FINISH_KEY);
  } catch {
    null;
  }
}

export function setSignupSkipProfileAfterTerms(value) {
  try {
    mmkvStorage.setItem(SIGNUP_SKIP_PROFILE_AFTER_TERMS_KEY, value ? '1' : '0');
    emitAuthFlagsChanged();
  } catch {
    null;
  }
}

export function clearSignupSkipProfileAfterTerms() {
  try {
    mmkvStorage.removeItem(SIGNUP_SKIP_PROFILE_AFTER_TERMS_KEY);
    emitAuthFlagsChanged();
  } catch {
    null;
  }
}

export function setPhoneVerifyThenFamily(value) {
  try {
    mmkvStorage.setItem(PHONE_VERIFY_THEN_FAMILY_KEY, value ? '1' : '0');
    emitAuthFlagsChanged();
  } catch {
    null;
  }
}

export function clearPhoneVerifyThenFamily() {
  try {
    mmkvStorage.removeItem(PHONE_VERIFY_THEN_FAMILY_KEY);
    emitAuthFlagsChanged();
  } catch {
    null;
  }
}

export const setPendingSignupTermsParams = async params => {
  try {
    if (params == null) {
      await mmkvStorage.removeItem(PENDING_SIGNUP_TERMS_JSON_KEY);
    } else {
      await mmkvStorage.setItem(
        PENDING_SIGNUP_TERMS_JSON_KEY,
        JSON.stringify(params),
      );
    }
  } catch {
    null;
  }
};

export const clearPendingSignupTermsParams = async () => {
  try {
    await mmkvStorage.removeItem(PENDING_SIGNUP_TERMS_JSON_KEY);
  } catch {
    null;
  }
};

export const getStoredPhoneVerificationPending = async () => {
  try {
    const v = await mmkvStorage.getItem(PHONE_VERIFICATION_PENDING_STORAGE_KEY);
    return v === '1' || v === 'true';
  } catch {
    return false;
  }
};

export const setStoredPhoneVerificationPending = async pending => {
  try {
    await mmkvStorage.setItem(
      PHONE_VERIFICATION_PENDING_STORAGE_KEY,
      pending ? '1' : '0',
    );
    emitAuthFlagsChanged();
  } catch {
    null;
  }
};

export const setSignupAwaitingPhone = async awaiting => {
  try {
    await mmkvStorage.setItem(SIGNUP_AWAITING_PHONE_KEY, awaiting ? '1' : '0');
    emitAuthFlagsChanged();
  } catch {
    null;
  }
};

export const getSignupAwaitingPhone = async () => {
  try {
    const v = await mmkvStorage.getItem(SIGNUP_AWAITING_PHONE_KEY);
    return v === '1' || v === 'true';
  } catch {
    return false;
  }
};

export const setSignupRequiresPhone = async required => {
  try {
    await mmkvStorage.setItem(
      SIGNUP_REQUIRES_PHONE_KEY,
      required ? '1' : '0',
    );
    emitAuthFlagsChanged();
  } catch {
    null;
  }
};

export const getSignupRequiresPhone = async () => {
  try {
    const v = await mmkvStorage.getItem(SIGNUP_REQUIRES_PHONE_KEY);
    return v === '1' || v === 'true';
  } catch {
    return false;
  }
};

/**
 * 전화 인증 완료 후 모든 phone 관련 MMKV 플래그를 한 번에 정리.
 * emit은 호출부에서 Redux `clearPhoneVerificationPending` 이후에 한 번만 보낸다.
 * (여기서 emit하면 리스너가 먼저 리렌더될 때 Redux는 아직 전화 대기(true)라 전화 화면으로 되돌아감)
 * @param {string|null} nextStep - SIGNUP_PROGRESS_STEP 값 (TERMS / PROFILE / null)
 */
export const completePhoneVerification = nextStep => {
  try {
    mmkvStorage.setItem(PHONE_VERIFICATION_PENDING_STORAGE_KEY, '0');
    mmkvStorage.setItem(SIGNUP_AWAITING_PHONE_KEY, '0');
    mmkvStorage.setItem(SIGNUP_REQUIRES_PHONE_KEY, '0');
    if (nextStep) {
      mmkvStorage.setItem(SIGNUP_PROGRESS_STEP_KEY, String(nextStep));
    } else {
      mmkvStorage.removeItem(SIGNUP_PROGRESS_STEP_KEY);
    }
  } catch {
    null;
  }
};

/**
 * 약관 동의 제출: pending JSON + 다음 단계(PROFILE)를 한 번에 쓰고 마지막에만 emit.
 * (pending만 먼저 쓰고 emit하면 Root가 hasPending만 보고 프로필로 보내 약관이 두 번 필요한 것처럼 보일 수 있음)
 */
export const commitTermsConsentAndAdvanceToProfile = async termsParams => {
  if (termsParams == null || typeof termsParams !== 'object') {
    throw new Error('약관 동의 정보가 없어요.');
  }
  try {
    await mmkvStorage.setItem(
      PENDING_SIGNUP_TERMS_JSON_KEY,
      JSON.stringify(termsParams),
    );
    await mmkvStorage.setItem(
      SIGNUP_PROGRESS_STEP_KEY,
      String(SIGNUP_PROGRESS_STEP.PROFILE),
    );
    emitAuthFlagsChanged();
  } catch {
    throw new Error('진행 정보를 저장하지 못했어요.');
  }
};

/**
 * 약관 동의 저장 후 전화 인증 단계로 (회원가입: 약관 → 전화 → 가족)
 */
export const commitTermsConsentAndAdvanceToPhone = async termsParams => {
  if (termsParams == null || typeof termsParams !== 'object') {
    throw new Error('약관 동의 정보가 없어요.');
  }
  try {
    await mmkvStorage.setItem(
      PENDING_SIGNUP_TERMS_JSON_KEY,
      JSON.stringify(termsParams),
    );
    await mmkvStorage.setItem(
      SIGNUP_PROGRESS_STEP_KEY,
      String(SIGNUP_PROGRESS_STEP.PHONE),
    );
    await mmkvStorage.setItem(PHONE_VERIFICATION_PENDING_STORAGE_KEY, '1');
    await mmkvStorage.setItem(SIGNUP_AWAITING_PHONE_KEY, '1');
    await mmkvStorage.setItem(SIGNUP_REQUIRES_PHONE_KEY, '1');
    emitAuthFlagsChanged();
  } catch {
    throw new Error('진행 정보를 저장하지 못했어요.');
  }
};

/**
 * 약관만 저장하고 유저정보(이름·생일) 단계 없이 곧바로 가족 단계로 (전화 인증이 이미 끝난 경우)
 */
export const commitTermsConsentAndSkipProfileToFamily = async termsParams => {
  if (termsParams == null || typeof termsParams !== 'object') {
    throw new Error('약관 동의 정보가 없어요.');
  }
  try {
    await mmkvStorage.setItem(
      PENDING_SIGNUP_TERMS_JSON_KEY,
      JSON.stringify(termsParams),
    );
    await mmkvStorage.setItem(
      SIGNUP_PROGRESS_STEP_KEY,
      String(SIGNUP_PROGRESS_STEP.FAMILY),
    );
    emitAuthFlagsChanged();
  } catch {
    throw new Error('진행 정보를 저장하지 못했어요.');
  }
};

/**
 * 유저정보 저장 완료 후: pending 약관 JSON 제거 + 단계 FAMILY 한 번에 반영(emit 1회).
 */
export const advanceSignupAfterProfileSaved = () => {
  try {
    mmkvStorage.removeItem(PENDING_SIGNUP_TERMS_JSON_KEY);
    mmkvStorage.setItem(
      SIGNUP_PROGRESS_STEP_KEY,
      String(SIGNUP_PROGRESS_STEP.FAMILY),
    );
  } catch {
    null;
  }
  emitAuthFlagsChanged();
};

/**
 * 프로필 저장 후 전화 인증이 필요할 때: pending 약관 제거 + PHONE 단계·플래그 (emit 1회).
 * 가족 API는 phoneVerified 이후에만 허용되므로 FAMILY 단계로 가기 전에 호출한다.
 */
export const advanceSignupAfterProfileBeforePhone = () => {
  try {
    mmkvStorage.removeItem(PENDING_SIGNUP_TERMS_JSON_KEY);
    mmkvStorage.setItem(
      SIGNUP_PROGRESS_STEP_KEY,
      String(SIGNUP_PROGRESS_STEP.PHONE),
    );
    mmkvStorage.setItem(PHONE_VERIFICATION_PENDING_STORAGE_KEY, '1');
    mmkvStorage.setItem(SIGNUP_AWAITING_PHONE_KEY, '1');
    mmkvStorage.setItem(SIGNUP_REQUIRES_PHONE_KEY, '1');
  } catch {
    null;
  }
  emitAuthFlagsChanged();
};

/** 가족 참여/생성 완료 → 설정완료 단계 (emit 포함). 네비 replace 이후 queueMicrotask 등으로 호출 권장 */
export const commitSignupProgressFinish = () => {
  try {
    mmkvStorage.setItem(
      SIGNUP_PROGRESS_STEP_KEY,
      String(SIGNUP_PROGRESS_STEP.FINISH),
    );
  } catch {
    null;
  }
  emitAuthFlagsChanged();
};

/**
 * 약관 동의 후 전화 인증 화면으로 진입할 때 모든 phone 관련 플래그를 한 번에 세팅.
 * MMKV write는 동기이므로 await 없이 연속 호출해 중간 emit을 막고, 마지막에 한 번만 emit.
 */
export const startPhoneVerificationForSignup = () => {
  try {
    mmkvStorage.setItem(SIGNUP_PROGRESS_STEP_KEY, SIGNUP_PROGRESS_STEP.PHONE);
    mmkvStorage.setItem(PHONE_VERIFICATION_PENDING_STORAGE_KEY, '1');
    mmkvStorage.setItem(SIGNUP_AWAITING_PHONE_KEY, '1');
    mmkvStorage.setItem(SIGNUP_REQUIRES_PHONE_KEY, '1');
  } catch {
    null;
  }
  emitAuthFlagsChanged();
};

/** 로그아웃·온보딩 완료 시 가입 보조 플래그 일괄 삭제 */
export const clearSignupOnboardingAux = async () => {
  try {
    await mmkvStorage.multiRemove([
      SIGNUP_PROGRESS_STEP_KEY,
      PENDING_SIGNUP_TERMS_JSON_KEY,
      PHONE_VERIFICATION_PENDING_STORAGE_KEY,
      SIGNUP_AWAITING_PHONE_KEY,
      SIGNUP_REQUIRES_PHONE_KEY,
      PHONE_VERIFY_THEN_FAMILY_KEY,
      SIGNUP_SKIP_PROFILE_AFTER_TERMS_KEY,
      FAMILY_SKIP_PENDING_FINISH_KEY,
    ]);
  } catch {
    null;
  }
};

/** 탈퇴 직후: 다음 로그인에서 약관부터 보여주기 */
export function markForceTermsNextLoginSync() {
  try {
    mmkvSetStringSync(FORCE_TERMS_NEXT_LOGIN_KEY, '1');
  } catch {
    null;
  }
  emitAuthFlagsChanged();
}

/** 1회 플래그 소비 */
export function consumeForceTermsNextLoginSync() {
  try {
    const raw = mmkvGetStringSync(FORCE_TERMS_NEXT_LOGIN_KEY);
    const enabled = raw === '1' || raw === 'true';
    if (!enabled) return false;
    mmkvStorage.removeItem(FORCE_TERMS_NEXT_LOGIN_KEY);
    return true;
  } catch {
    return false;
  }
}

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
    if (hasFamily) {
      mmkvStorage.removeItem(FAMILY_SETUP_SKIPPED_KEY);
    }
    emitAuthFlagsChanged();
  } catch (error) {
    null;
  }
};

export const setFamilySetupSkipped = () => {
  try {
    mmkvStorage.setItem(FAMILY_SETUP_SKIPPED_KEY, '1');
  } catch {}
  emitAuthFlagsChanged();
};

/** 가족 설정 스킵: needsSignup 끔 + skipped 표시 + 가입 보조 플래그 동기 제거 후 emit */
export const skipFamilySetupAndComplete = () => {
  try {
    mmkvSetStringSync(NEEDS_SIGNUP_KEY, JSON.stringify(false));
    mmkvSetStringSync(FAMILY_SETUP_SKIPPED_KEY, '1');
    mmkvStorage.removeItem(FAMILY_SKIP_PENDING_FINISH_KEY);
    mmkvStorage.removeItem(SIGNUP_PROGRESS_STEP_KEY);
    mmkvStorage.removeItem(PHONE_VERIFICATION_PENDING_STORAGE_KEY);
    mmkvStorage.removeItem(SIGNUP_AWAITING_PHONE_KEY);
    mmkvStorage.removeItem(SIGNUP_REQUIRES_PHONE_KEY);
    mmkvStorage.removeItem(PHONE_VERIFY_THEN_FAMILY_KEY);
    mmkvStorage.removeItem(SIGNUP_SKIP_PROFILE_AFTER_TERMS_KEY);
    mmkvStorage.removeItem(PENDING_SIGNUP_TERMS_JSON_KEY);
  } catch {}
  emitAuthFlagsChanged();
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

export function setPendingInviteCode(code) {
  try {
    mmkvStorage.setItem(PENDING_INVITE_CODE_KEY, code);
  } catch {}
}

export function getPendingInviteCodeSync() {
  try {
    return mmkvGetStringSync(PENDING_INVITE_CODE_KEY) ?? null;
  } catch {
    return null;
  }
}

export function clearPendingInviteCode() {
  try {
    mmkvStorage.removeItem(PENDING_INVITE_CODE_KEY);
  } catch {}
}

export const deleteLoginInfo = async () => {
  // 앱 강종/백그라운드 등으로 async 삭제가 끝나기 전에 재실행되면 자동로그인이 다시 될 수 있어
  // MMKV 토큰을 먼저 "동기"로 비워 안정성을 높인다.
  try {
    mmkvSetStringSync(ACCESS_TOKEN_KEY, '');
  } catch {
    null;
  }

  // Keychain/MMKV 중 하나가 실패해도 다른 쪽은 반드시 정리되도록 분리 처리
  try {
    await mmkvStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {
    null;
  }
  try {
    // resetGenericPassword는 실패 시 throw 대신 false를 반환할 수 있음
    const ok = await Keychain.resetGenericPassword();
    if (ok !== true) {
      // 남아있는 토큰이 자동로그인으로 이어지지 않도록 "빈 토큰"으로 한 번 덮어쓴 뒤 재시도
      try {
        await Keychain.setGenericPassword('jwtToken', '', {
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        });
      } catch {
        null;
      }
      try {
        await Keychain.resetGenericPassword();
      } catch {
        null;
      }
    }
  } catch {
    null;
  }

  try {
    await mmkvStorage.removeItem(HAS_FAMILY_KEY);
  } catch {
    null;
  }
  try {
    await mmkvStorage.removeItem(NEEDS_SIGNUP_KEY);
  } catch {
    null;
  }
  try {
    await mmkvStorage.removeItem(LEGACY_GUEST_MODE_KEY);
  } catch {
    null;
  }
  try {
    mmkvStorage.removeItem(FAMILY_SETUP_SKIPPED_KEY);
    mmkvStorage.removeItem(FAMILY_SKIP_PENDING_FINISH_KEY);
  } catch {
    null;
  }
  try {
    await clearSignupOnboardingAux();
  } catch {
    null;
  }

  emitAuthFlagsChanged();
};
