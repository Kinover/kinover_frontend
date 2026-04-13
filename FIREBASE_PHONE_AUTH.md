# Firebase Phone Auth 설정 가이드

> 전화번호 인증(SMS OTP) 기능 설정 메모.  
> Last updated: 2026-04-13

---

## 패키지

```bash
npm install @react-native-firebase/auth@22   # app@22.x 버전과 반드시 일치
cd ios && pod install
```

> `@react-native-firebase/app`, `auth`, `messaging` 등 RNFB 패키지는 메이저 버전이 모두 동일해야 함.

---

## iOS — Podfile 설정

`FirebaseAuth`는 Swift pod이라 의존 pod들에 `modular_headers`가 필요.  
`ios/Podfile`에 아래 항목이 있어야 함:

```ruby
pod 'GoogleUtilities',           :modular_headers => true
pod 'FirebaseCoreInternal',      :modular_headers => true
pod 'FirebaseCore',              :modular_headers => true
pod 'FirebaseInstallations',     :modular_headers => true
pod 'FirebaseAuthInterop',       :modular_headers => true
pod 'FirebaseAppCheckInterop',   :modular_headers => true
pod 'FirebaseCoreExtension',     :modular_headers => true
pod 'RecaptchaInterop',          :modular_headers => true
```

---

## Android — Firebase Console 설정 (필수)

### 1. Phone Authentication 활성화
Firebase Console → Authentication → Sign-in method → 전화 → 사용 설정

### 2. SHA-1 지문 등록 (없으면 SMS 발송 안 됨)

```bash
cd android && ./gradlew signingReport
```

출력에서 `Variant: debug` 아래 `SHA1:` 값 복사  
→ Firebase Console → 프로젝트 설정 → 내 앱(Android) → SHA 인증서 지문 추가

릴리즈 빌드는 릴리즈 키스토어의 SHA-1도 별도 등록 필요.

### 3. google-services.json 재다운로드

SHA-1 등록 후 Firebase Console에서 최신 `google-services.json` 다운로드  
→ `android/app/google-services.json` 덮어쓰기

---

## 에뮬레이터/시뮬레이터 테스트

Firebase Phone Auth는 실기기에서만 SMS가 실제 발송됨.  
에뮬레이터에서 테스트하려면:

Firebase Console → Authentication → Sign-in method → 전화 → **테스트 전화번호** 등록  
(예: `+82 10-0000-0001` / 인증코드 `123456`)

---

## 관련 파일

| 파일 | 역할 |
|------|------|
| `src/features/auth/screens/PhoneVerificationScreen.jsx` | 전화번호 입력 + OTP 입력 2단계 UI |
| `src/features/auth/services/authApi.js` | `POST /api/auth/phone/verify` RTK Query mutation |
| `src/features/auth/store/loginSlice.js` | `phoneVerificationPending` 상태 (`needed: bool`) |
| `src/features/auth/store/loginThunk.js` | `finalizeAfterPhoneVerificationThunk` — 인증 완료 후 라우팅 |
| `src/features/auth/hooks/useKakaoLogin.js` | `phoneVerified: false` 시 pending 플래그 세팅 |
| `src/features/auth/hooks/useAppleLogin.js` | 동일 |
| `src/app/navigation/rootScreen.jsx` | `phoneVerificationPending.needed` → 인증 화면으로 분기 |
| `src/utils/apiClient.js` | `DUPLICATE_PHONE_NUMBER` 409 → `showApiError` 억제 |

---

## 인증 플로우 요약

```
소셜 로그인 응답 phoneVerified: false
  → dispatch(setPhoneVerificationPending())
  → dispatch(setAuthChecked(true))
  → rootScreen: '전화번호인증화면' 렌더

PhoneVerificationScreen
  1단계: 전화번호 입력 → Firebase signInWithPhoneNumber()
  2단계: OTP 입력 → confirmationResult.confirm(otp)
              → result.user.getIdToken()
              → POST /api/auth/phone/verify {userId, idToken}
              → dispatch(finalizeAfterPhoneVerificationThunk())
              → dispatch(clearPhoneVerificationPending())
              → rootScreen 자동 리라우팅
```
