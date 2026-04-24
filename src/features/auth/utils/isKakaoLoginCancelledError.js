import {Platform} from 'react-native';

/**
 * @react-native-seoul/kakao-login 실패 시 네이티브가 넘기는 메시지는 플랫폼/SDK마다 다름.
 * 사용자가 로그인 창을 닫거나 취소한 경우에는 로그아웃·Alert 없이 무시한다.
 *
 * iOS: "kakao.com으로 로그인" 시스템 시트에서 취소 시
 * `com.apple.AuthenticationServices.WebAuthenticationSession error 1`(canceledLogin) 형태가
 * 한국어로는 "작업을 완료할 수 없습니다 … 오류 1"처럼 오며 '취소' 문자열이 없을 수 있음.
 *
 * RN은 Swift `reject(code, message, nil)` 시 NSError 전체가 안 넘어와 `e.code`가 `RNKakaoLogins`만
 * 오는 경우가 많아, `localizedDescription` 문자열 매칭이 핵심이다.
 *
 * Kakao iOS SDK: 취소 시 `The operation couldn't be completed. (KakaoSDKCommon.SdkError error 0.)`처럼
 * **SdkError error 0**만 오고 '취소'·WebAuthenticationSession 문구가 없을 수 있음.
 *
 * @param {unknown} e
 * @returns {boolean}
 */
export function isKakaoLoginCancelledError(e) {
  if (e == null) return false;

  // NSError가 bridge에 실릴 때(서드파티·RN 버전에 따라)
  const jsCode = String(e?.code ?? '');
  if (/WEBAUTHENTICATIONSESSION1$/i.test(jsCode)) return true;
  if (/SFAuthenticationSession1$/i.test(jsCode)) return true;

  const parts = [
    typeof e?.message === 'string' ? e.message : '',
    typeof e?.nativeErrorMessage === 'string' ? e.nativeErrorMessage : '',
    typeof e?.userInfo?.NSLocalizedDescription === 'string'
      ? e.userInfo.NSLocalizedDescription
      : '',
    typeof e?.userInfo?.NSLocalizedFailureReason === 'string'
      ? e.userInfo.NSLocalizedFailureReason
      : '',
  ];
  const text = parts.join(' ').trim();
  const low = text.toLowerCase();

  if (text) {
    // Kakao iOS SDK — 사용자가 로그인/동의 흐름을 닫으면 SdkError error 0으로 자주 옴
    if (/kakaosdkcommon\.sdkerror\s*error\s*0\b/i.test(low)) return true;

    if (text.includes('취소')) return true;
    if (/\bcancel(l)?ed\b/i.test(text)) return true;
    if (low.includes('user cancelled') || low.includes('user canceled')) return true;
    if (
      low.includes('cancelled by the user') ||
      low.includes('canceled by the user')
    ) {
      return true;
    }
    if (
      low.includes('request was cancelled') ||
      low.includes('request was canceled')
    ) {
      return true;
    }
    if (low.includes('was cancelled') || low.includes('was canceled')) return true;
    if (low.includes('closed by user') || low.includes('dismissed')) return true;

    // Android Kakao SDK: 동의·계정 화면에서 사용자가 나가면 AccessDenied로 올 때가 많음
    if (low.includes('access denied') || low.includes('accessdenied')) return true;

    // iOS ASWebAuthenticationSession / SFAuthenticationSession — 사용자가 시스템 시트에서 취소
    if (low.includes('webauthenticationsession')) return true;
    if (low.includes('sfauthenticationsession')) return true;
    if (low.includes('authenticationservices')) return true;
    if (low.includes('canceledlogin')) return true;
    if (low.includes('canceled login')) return true;
    if (low.includes('cancelled login')) return true;
    if (low.includes('authentication session')) return true;
    if (low.includes('web authentication session')) return true;

    // 한국어 로캘: "작업을 완료할 수 없습니다 … 오류 1" (취소 문구 없음)
    if (text.includes('완료할 수 없') && /\b오류\s*1\b/.test(text)) return true;
    if (text.includes('완료할 수 없') && /\berror\s*1\b/i.test(text)) return true;
  }

  // RN이 NSError를 풀어 줄 때 (환경마다 다름)
  const userInfo = e?.userInfo && typeof e.userInfo === 'object' ? e.userInfo : null;
  if (userInfo) {
    const domain = String(userInfo.NSErrorDomain || userInfo.domain || '');
    const codeRaw = userInfo.NSErrorCode ?? userInfo.code ?? userInfo.NSUnderlyingErrorCode;
    const codeNum = Number(codeRaw);
    if (
      domain.includes('AuthenticationServices') ||
      domain.includes('WebAuthenticationSession')
    ) {
      if (codeNum === 1 || codeRaw === '1') return true;
    }
  }

  // 시스템 시트 취소만 짧은 일반 문구로 오는 경우(영문 도메인 생략된 로캘 등)
  const noHttpError = e?.response == null && e?.status == null;
  if (
    Platform.OS === 'ios' &&
    noHttpError &&
    text &&
    /com\.apple/i.test(text) &&
    (/완료할 수 없/.test(text) ||
      /the operation could not be completed|the operation couldn\u2019t be completed|couldn't be completed/i.test(
        low,
      ))
  ) {
    return true;
  }

  // Swift reject 첫 인자가 code로 올 때: 카카오 네이티브만 + HTTP 에러 아님 + 짧은 일반 실패 문구
  if (
    Platform.OS === 'ios' &&
    noHttpError &&
    jsCode === 'RNKakaoLogins' &&
    text &&
    text.length <= 160 &&
    /완료할 수 없/.test(text)
  ) {
    return true;
  }

  return false;
}
