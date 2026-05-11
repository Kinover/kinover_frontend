// src/features/auth/screens/PhoneVerificationScreen.jsx
import React, {useState, useEffect, useCallback, useRef} from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import SpringPressable from 'components/SpringPressable';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRoute, useNavigation, StackActions} from '@react-navigation/native';
import {useDispatch} from 'react-redux';
import {updateUser} from 'features/home/store/userSlice';
import {emitAuthFlagsChanged} from 'utils/authFlagsEvent';
import auth from '@react-native-firebase/auth';

import CustomInput from 'components/CustomInput';
import BottomActionButton from 'components/BottomActionButton';
import {
  getToken,
  completePhoneVerification,
  SIGNUP_PROGRESS_STEP,
  getPendingSignupTermsParams,
  getNeedsSignup,
  getAuthRoutingMmkvSnapshotSync,
  clearPhoneVerifyThenFamily,
  commitSignupProgressFinish,
  markFamilySkipFinishScreenPendingSync,
} from 'utils/storage';
import {clearPhoneVerificationPending} from '../store/loginSlice';
import {finalizeAfterPhoneVerificationThunk} from '../store/loginThunk';
import {useVerifyPhoneMutation} from '../services/authApi';

// ==================== Constants ====================

const OTP_TIMER_SECONDS = 180;

const TEST_PHONE_NUMBERS = ['01011112222', '01012345678'];
const TEST_OTP_CODE = '123456';

function isTestPhone(digits) {
  return TEST_PHONE_NUMBERS.includes(digits);
}

// ==================== Helpers ====================

/**
 * 전화번호를 Firebase E.164 형식(+82XXXXXXXXXX)으로 변환
 * 예) 010-1234-5678 → +821012345678
 */
function toE164Korea(phone) {
  const digits = String(phone ?? '').replace(/\D/g, '');
  if (digits.startsWith('82')) {
    return '+' + digits;
  }
  const local = digits.startsWith('0') ? digits.slice(1) : digits;
  return '+82' + local;
}

/** 하이픈 등 없이 숫자만 허용 (붙여넣기 010-1234-5678 도 자동 정리) */
function digitsOnlyPhoneInput(raw) {
  return String(raw ?? '')
    .replace(/\D/g, '')
    .slice(0, 11);
}

function formatTimer(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function firebaseAuthErrorCode(error) {
  const c = error?.code;
  if (typeof c === 'string' && c.startsWith('auth/')) return c;
  const native = error?.userInfo?.code ?? error?.nativeErrorCode;
  if (typeof native === 'string' && native.startsWith('auth/')) return native;
  return typeof c === 'string' ? c : null;
}

function getFirebaseErrorMessage(error) {
  const code = firebaseAuthErrorCode(error);
  switch (code) {
    case 'auth/invalid-phone-number':
      return '올바르지 않은 전화번호 형식이에요.';
    case 'auth/too-many-requests':
      return '같은 번호·기기로 인증을 너무 자주 시도했어요. 보통 10~30분 뒤에 풀립니다. 개발할 때는 Firebase 콘솔 → Authentication → 전화 → 테스트 전화번호를 쓰면 제한 없이 확인할 수 있어요.';
    case 'auth/quota-exceeded':
      return '오늘 보낼 수 있는 인증 문자 한도에 가까워요. 잠시 후 다시 시도하거나, Firebase 요금·할당량을 확인해 주세요.';
    case 'auth/network-request-failed':
      return '네트워크 연결을 확인해 주세요.';
    case 'auth/invalid-verification-code':
      return '인증번호가 올바르지 않아요.';
    case 'auth/code-expired':
      return '인증번호가 만료됐어요. 인증번호를 다시 받아주세요.';
    case 'auth/missing-client-identifier':
    case 'auth/app-not-authorized':
      return '앱 설정(Firebase·번들 ID·GoogleService-Info)을 확인해 주세요.';
    case 'auth/missing-app-credential':
    case 'auth/invalid-app-credential':
      return '기기 인증 정보가 맞지 않아요. 앱을 다시 빌드해 설치하거나 잠시 후 다시 시도해 주세요.';
    case 'auth/captcha-check-failed':
      return '로봇 확인에 실패했어요. 잠시 후 다시 시도해 주세요.';
    case 'auth/web-context-cancelled':
    case 'auth/web-context-canceled':
      return '본인 확인 화면이 닫혔어요. 다시 인증번호를 받아 주세요.';
    case 'auth/internal-error':
      return 'Firebase 전화 인증 일시 오류예요. 실기기에서 VPN 끄고 재시도하거나, Xcode Clean Build 후 앱을 다시 설치해 보세요.';
    default:
      return '본인 확인(로봇 체크) 후에도 연결에 실패했을 수 있어요. 앱을 다시 빌드해 설치한 뒤 재시도해 주세요.';
  }
}

// ==================== Main Component ====================

export default function PhoneVerificationScreen() {
  const dispatch = useDispatch();
  const route = useRoute();
  const navigation = useNavigation();
  const [verifyPhoneApi] = useVerifyPhoneMutation();

  // 단계: 'phone' → 전화번호 입력, 'otp' → 인증번호 입력
  const [step, setStep] = useState('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(OTP_TIMER_SECONDS);
  const [canResend, setCanResend] = useState(false);
  /** Firebase too-many-requests 등 이후 연타 방지(초) */
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);

  const timerRef = useRef(null);

  // ── 타이머 ──────────────────────────────────────────────────

  const startTimer = useCallback(() => {
    setTimer(OTP_TIMER_SECONDS);
    setCanResend(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (rateLimitSeconds <= 0) return undefined;
    const id = setInterval(() => {
      setRateLimitSeconds(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [rateLimitSeconds > 0]);

  // ── SMS 발송 ──────────────────────────────────────────────────

  const handleSendOtp = useCallback(async () => {
    if (rateLimitSeconds > 0) return;
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 11) {
      setError('휴대폰 번호 10~11자리 숫자를 입력해 주세요.');
      return;
    }
    setError('');
    setLoading(true);

    // 테스트 번호: Firebase SMS 스킵, OTP 자동입력
    if (isTestPhone(digits)) {
      setConfirmationResult(null);
      setOtpCode(TEST_OTP_CODE);
      setStep('otp');
      startTimer();
      setLoading(false);
      return;
    }

    try {
      const e164 = toE164Korea(phoneNumber);
      const result = await auth().signInWithPhoneNumber(e164);
      setConfirmationResult(result);
      setOtpCode('');
      setStep('otp');
      startTimer();
    } catch (e) {
      const errCode = firebaseAuthErrorCode(e);

      if (
        errCode === 'auth/too-many-requests' ||
        errCode === 'auth/quota-exceeded'
      ) {
        setRateLimitSeconds(180);
      }
      setError(getFirebaseErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [phoneNumber, startTimer, rateLimitSeconds]);

  // ── OTP 확인 + 백엔드 검증 ────────────────────────────────────

  const handleVerifyOtp = useCallback(async () => {
    if (!otpCode || otpCode.length < 6) {
      setError('인증번호 6자리를 입력해 주세요.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const digits = phoneNumber.replace(/\D/g, '');
      const testMode = isTestPhone(digits) && otpCode === TEST_OTP_CODE;

      if (!testMode && !confirmationResult) {
        setError('인증 세션이 만료됐어요. 인증번호를 다시 받아주세요.');
        return;
      }

      let verifyPayload;
      if (testMode) {
        // 테스트 번호: Firebase 스킵, 백엔드에 testPhone 플래그 전송
        verifyPayload = {testPhone: digits, testCode: TEST_OTP_CODE};
      } else {
        // 1) Firebase OTP 확인 → idToken 획득
        const result = await confirmationResult.confirm(otpCode);
        const idToken = await result.user.getIdToken();
        verifyPayload = {idToken};
      }

      const serverJwt = await getToken();
      if (!serverJwt || !String(serverJwt).trim()) {
        throw new Error('로그인이 만료됐어요. 다시 로그인한 뒤 전화 인증을 진행해 주세요.');
      }

      await verifyPhoneApi(verifyPayload).unwrap();

      dispatch(updateUser({phoneVerified: true}));

      const {phoneVerifyThenFamily} = getAuthRoutingMmkvSnapshotSync();
      if (route.params?.continueToFamilyAfterVerify || phoneVerifyThenFamily) {
        // 가입 과정에서 가족 설정 화면 생략 → 설정완료로 이동
        completePhoneVerification(SIGNUP_PROGRESS_STEP.FINISH);
        dispatch(clearPhoneVerificationPending());
        markFamilySkipFinishScreenPendingSync();
        commitSignupProgressFinish();
        navigation.dispatch(
          StackActions.replace('설정완료화면', {skippedFamilySetup: true}),
        );
        Promise.resolve().then(() => {
          emitAuthFlagsChanged();
        });
        clearPhoneVerifyThenFamily();
        await dispatch(finalizeAfterPhoneVerificationThunk());
        return;
      }

      // 다음 단계: 약관→전화 플로우는 보통 route.params 없이 오므로 MMKV pending을 항상 조회
      let termsPayload = route.params?.termsPayload;
      if (!termsPayload?.termsAgreed || !termsPayload?.privacyAgreed) {
        const fromMmkv = await getPendingSignupTermsParams();
        if (fromMmkv?.termsAgreed && fromMmkv?.privacyAgreed) {
          termsPayload = fromMmkv;
        }
      }
      const snap = getAuthRoutingMmkvSnapshotSync();
      const needsSignup = await getNeedsSignup();
      const goesToProfile = !!(
        termsPayload?.termsAgreed && termsPayload?.privacyAgreed
      );
      const signupPending = !!needsSignup;
      const inTermsThenPhoneFlow =
        snap.signupProgressStep === SIGNUP_PROGRESS_STEP.PHONE ||
        snap.hasPendingSignupTerms;

      const shouldGoToFamilySetup =
        goesToProfile || signupPending || inTermsThenPhoneFlow;

      // 약관 동의 후 전화 인증 완료 → 가족 설정 (회원가입: 약관 → 전화 → 가족 → 홈)
      // MMKV를 Redux보다 먼저 정리해야 함. clearPhoneVerificationPending만 먼저 dispatch하면
      // RootScreen이 그 사이에 리렌더될 때 동기 MMKV 읽기는 아직 전화 대기(true)라
      // 전화번호 화면으로 다시 고정되는 레이스가 난다. (이전엔 React state 캐시 이슈로 순서를 바꿔 썼음)
      if (shouldGoToFamilySetup) {
        // 가족 설정 화면 생략 → finish로 전환
        completePhoneVerification(SIGNUP_PROGRESS_STEP.FINISH);
      } else {
        completePhoneVerification(null);
      }

      dispatch(clearPhoneVerificationPending());

      if (shouldGoToFamilySetup) {
        markFamilySkipFinishScreenPendingSync();
        commitSignupProgressFinish();
        navigation.dispatch(
          StackActions.replace('설정완료화면', {skippedFamilySetup: true}),
        );
      }

      Promise.resolve().then(() => {
        emitAuthFlagsChanged();
      });

      await dispatch(finalizeAfterPhoneVerificationThunk());
    } catch (e) {
      // RTK Query unwrap 에러 형식: {status, data}
      const status = e?.status ?? e?.response?.status;
      const code = e?.data?.code ?? e?.response?.data?.code;

      if (status === 409 && code === 'DUPLICATE_PHONE_NUMBER') {
        try {
          await auth().signOut();
        } catch {
          null;
        }
        return;
      }

      if (status === 401) {
        setError(
          e?.data?.message ??
            e?.response?.data?.message ??
            '로그인이 필요해요. 다시 로그인한 뒤 시도해 주세요.',
        );
        return;
      }

      // Firebase 에러 처리
      if (e?.code?.startsWith?.('auth/')) {
        setError(getFirebaseErrorMessage(e));
        return;
      }

      setError(e?.message ?? '인증 중 오류가 발생했어요. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  }, [
    otpCode,
    confirmationResult,
    dispatch,
    verifyPhoneApi,
    route.params?.termsPayload,
    route.params?.continueToFamilyAfterVerify,
    navigation,
  ]);

  // ── 인증번호 재전송 ───────────────────────────────────────────

  const handleResend = useCallback(async () => {
    setOtpCode('');
    setError('');
    await handleSendOtp();
  }, [handleSendOtp]);

  // ── OTP 입력 단계 ─────────────────────────────────────────────

  if (step === 'otp') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Text allowFontScaling={false} style={styles.title}>
              인증번호를 입력해 주세요
            </Text>
            <Text allowFontScaling={false} style={styles.sub}>
              {toE164Korea(phoneNumber)}로 전송된{'\n'}6자리 번호를 입력해
              주세요.
            </Text>

            <View style={styles.field}>
              <Text allowFontScaling={false} style={styles.label}>
                인증번호{' '}
                <Text allowFontScaling={false} style={styles.star}>
                  *
                </Text>
              </Text>
              <View style={styles.otpRow}>
                <View style={styles.otpInputWrap}>
                  <CustomInput
                    allowFontScaling={false}
                    style={styles.input}
                    placeholder="6자리 입력"
                    placeholderTextColor="#9E9E9E"
                    value={otpCode}
                    onChangeText={text => {
                      setOtpCode(text.replace(/\D/g, '').slice(0, 6));
                      if (error) setError('');
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                  />
                </View>
                <Text
                  allowFontScaling={false}
                  style={[styles.timer, canResend && styles.timerExpired]}>
                  {canResend ? '만료됨' : formatTimer(timer)}
                </Text>
              </View>
            </View>

            {canResend ? (
              <SpringPressable
                onPress={handleResend}
                disabled={loading || rateLimitSeconds > 0}
                style={styles.resendButton}
                activeOpacity={0.85}>
                <Text allowFontScaling={false} style={styles.resendText}>
                  {rateLimitSeconds > 0
                    ? `재전송 가능 ${formatTimer(rateLimitSeconds)}`
                    : '인증번호 재전송'}
                </Text>
              </SpringPressable>
            ) : null}

            {error ? (
              <Text allowFontScaling={false} style={styles.error}>
                {error}
              </Text>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>

        <BottomActionButton
          useAppFontScaling={false}
          label={loading ? '확인 중...' : '확인'}
          onPress={handleVerifyOtp}
          disabled={loading || otpCode.length < 6}
        />
      </SafeAreaView>
    );
  }

  // ── 전화번호 입력 단계 ─────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text allowFontScaling={false} style={styles.title}>
            {'본인 확인을 위해\n전화번호 인증이 필요해요.'}
          </Text>
          <Text allowFontScaling={false} style={styles.sub}>
            하이픈(-) 없이 숫자만 입력해 주세요.
          </Text>

          <View style={styles.field}>
            <Text allowFontScaling={false} style={styles.label}>
              전화번호{' '}
              <Text allowFontScaling={false} style={styles.star}>
                *
              </Text>
            </Text>
            <CustomInput
              allowFontScaling={false}
              style={styles.input}
              placeholder="01012345678"
              placeholderTextColor="#9E9E9E"
              value={phoneNumber}
              onChangeText={text => {
                setPhoneNumber(digitsOnlyPhoneInput(text));
                if (error) setError('');
              }}
              keyboardType="number-pad"
              maxLength={11}
              autoFocus
              autoCorrect={false}
              returnKeyType="done"
            />
          </View>

          {error ? (
            <Text allowFontScaling={false} style={styles.error}>
              {error}
            </Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomActionButton
        useAppFontScaling={false}
        label={
          loading
            ? '발송 중...'
            : rateLimitSeconds > 0
              ? `잠시 후 다시 시도 (${formatTimer(rateLimitSeconds)})`
              : '인증번호 받기'
        }
        onPress={handleSendOtp}
        disabled={
          loading ||
          phoneNumber.replace(/\D/g, '').length < 10 ||
          rateLimitSeconds > 0
        }
      />
    </SafeAreaView>
  );
}

// ==================== Styles ====================

// 가입 전 화면 공통 입력 필드 스타일
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  title: {
    color: 'black',
    fontSize: 26,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 6,
  },
  sub: {
    color: '#6B7280',
    marginBottom: 30,
    fontSize: 13,
  },
  field: {
    marginBottom: 18,
  },
  label: {
    color: 'black',
    fontSize: 15,
    marginBottom: 6,
    fontWeight: '600',
  },
  star: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  otpRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  otpInputWrap: {
    flex: 1,
    marginRight: 12,
  },
  timer: {
    fontSize: 14,
    color: '#6B7280',
    minWidth: 44,
    textAlign: 'right',
  },
  timerExpired: {
    color: '#DC2626',
  },
  resendButton: {
    marginBottom: 16,
  },
  resendText: {
    color: 'black',
    fontSize: 14,
    fontWeight: '600',
  },
  error: {
    color: '#DC2626',
    marginBottom: 8,
    fontSize: 12,
  },
});
