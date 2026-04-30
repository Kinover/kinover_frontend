// src/screens/auth/TermsAgreementScreen.js

import React, {useState, useEffect, useRef, useMemo, useCallback} from 'react';
import {View, StyleSheet, TouchableOpacity, ScrollView, Text} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useSelector, useDispatch} from 'react-redux';
import BottomActionButton from 'components/BottomActionButton';
import {useNavigateToWhere} from 'hooks/useNavigateToWhere';
import {BottomSheetModal, BottomSheetBackdrop} from '@gorhom/bottom-sheet';
import ToastModal from 'components/modal/ToastModal';
import {COLORS} from 'styles/style';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveIconSize,
} from 'utils/responsive';
import {
  commitTermsConsentAndAdvanceToPhone,
  commitTermsConsentAndSkipProfileToFamily,
  advanceSignupAfterProfileSaved,
  clearSignupSkipProfileAfterTerms,
} from 'utils/storage';
import {setPhoneVerificationPending} from 'features/auth/store/loginSlice';
import {updateUserProfile} from 'api/userProfileApi';
import {syncMarketingNotificationFromServer} from 'features/home/store/userThunk';
import {getUserIdFromToken} from 'api/getUserIdFromToken';
import {formatDate} from 'features/auth/utils/formatSignupDate';

// 약관/개인정보 data import (경로는 프로젝트 alias에 맞춰져 있어야 함)
// alias 없으면 상대경로로 바꿔줘: ../../../data/legal
import {privacyPolicy} from 'data/legal/privacyPolicy';
import {termsOfService} from 'data/legal/termsOfService';
import {BOTTOM_SHEET_BUTTON_LABELS} from 'constants/bottomSheetTitles';
import SheetHeaderCloseIcon from 'components/bottomSheet/SheetHeaderCloseIcon';
/**
 * 마케팅 동의는 별도 문구로 유지 (필요하면 data로 빼도 됨)
 */
const MARKETING_TEXT = `마케팅 정보 수신 동의
- Kinover의 이벤트, 신규 기능, 프로모션 소식을 받아볼 수 있어요.
- 동의하지 않아도 서비스 이용에는 제한이 없어요.
- 동의 이후에도 앱 설정에서 언제든지 철회할 수 있어요.
`;

/**
 * 약관/개인정보 본문은 data 파일에서 가져오기
 */
const TERMS_TEXT = termsOfService?.content || '';
const PRIVACY_TEXT = privacyPolicy?.content || '';

/**
 * 버전은 data의 publishedAt(=공고일) 또는 version으로 사용
 * - 서버/DB에 저장할 때 “약관 버전”은 날짜 기반이 관리가 편함
 */
const TERMS_VERSION =
  termsOfService?.publishedAt || termsOfService?.version || 'v1';
const PRIVACY_VERSION =
  privacyPolicy?.publishedAt || privacyPolicy?.version || 'v1';

export default function TermsAgreementScreen() {
  const dispatch = useDispatch();
  const navigateToWhere = useNavigateToWhere();
  const user = useSelector(s => s?.user ?? {});
  const phoneVerified = user?.phoneVerified === true;

  const [agreeAll, setAgreeAll] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);

  const bottomSheetRef = useRef(null);
  const nextInFlightRef = useRef(false);
  const [detailType, setDetailType] = useState(null);

  // 가입 전 화면: 앱 글씨 크기 설정과 무관하게 시트 높이 고정
  const snapPoints = useMemo(() => ['73%'], []);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const isRequiredChecked = agreeTerms && agreePrivacy;

  const handleToggleAll = useCallback(() => {
    const next = !agreeAll;
    setAgreeAll(next);
    setAgreeTerms(next);
    setAgreePrivacy(next);
    setAgreeMarketing(next);
  }, [agreeAll]);

  const handleToggleItem = useCallback(type => {
    if (type === 'terms') setAgreeTerms(prev => !prev);
    if (type === 'privacy') setAgreePrivacy(prev => !prev);
    if (type === 'marketing') setAgreeMarketing(prev => !prev);
  }, []);

  useEffect(() => {
    if (agreeTerms && agreePrivacy && agreeMarketing) setAgreeAll(true);
    else setAgreeAll(false);
  }, [agreeTerms, agreePrivacy, agreeMarketing]);

  const handleNext = useCallback(async () => {
    if (!isRequiredChecked) {
      setToastMessage('필수 약관에 모두 동의해 주세요.');
      setToastVisible(true);
      return;
    }
    if (nextInFlightRef.current) return;
    nextInFlightRef.current = true;

    const now = new Date().toISOString();

    const termsParams = {
      termsAgreed: agreeTerms,
      privacyAgreed: agreePrivacy,
      marketingAgreed: agreeMarketing,
      termsVersion: TERMS_VERSION,
      privacyVersion: PRIVACY_VERSION,
      agreedAt: now,
      marketingAgreedAt: agreeMarketing ? now : null,
    };

    try {
      // 카카오 가입(needsSignup) 직후에는 fetchUser 전이라 Redux에 userId가 없을 수 있음 → JWT에서 보조
      const resolvedUserId =
        user?.userId ??
        user?.id ??
        (await getUserIdFromToken());
      if (resolvedUserId == null || String(resolvedUserId).trim() === '') {
        setToastMessage(
          '로그인 정보를 확인하지 못했어요. 잠시 후 다시 시도하거나 다시 로그인해 주세요.',
        );
        setToastVisible(true);
        return;
      }

      const agreedAtDate = new Date(termsParams.agreedAt || now);
      const payload = {
        userId: resolvedUserId,
        name: String(user.name || '').trim() || ' ',
        termsAgreed: termsParams.termsAgreed,
        privacyAgreed: termsParams.privacyAgreed,
        marketingAgreed: termsParams.marketingAgreed,
        termsVersion: termsParams.termsVersion,
        privacyVersion: termsParams.privacyVersion,
        agreedAt: formatDate(agreedAtDate),
        marketingAgreedAt: termsParams.marketingAgreed
          ? formatDate(new Date(termsParams.marketingAgreedAt || now))
          : null,
      };
      if (user.birth) {
        payload.birth = user.birth;
      }

      // 회원가입 순서: 약관 → (전화 미완 시) 전화 인증 → 가족 → 홈
      if (phoneVerified) {
        await commitTermsConsentAndSkipProfileToFamily(termsParams);
        await updateUserProfile(payload);
        dispatch(syncMarketingNotificationFromServer());
        advanceSignupAfterProfileSaved();
        clearSignupSkipProfileAfterTerms();
        navigateToWhere({
          screen: '가족설정화면',
          replace: true,
        });
      } else {
        await commitTermsConsentAndAdvanceToPhone(termsParams);
        await updateUserProfile(payload);
        dispatch(syncMarketingNotificationFromServer());
        dispatch(setPhoneVerificationPending());
        clearSignupSkipProfileAfterTerms();
        navigateToWhere({
          screen: '전화번호인증화면',
          replace: true,
        });
      }
    } catch {
      setToastMessage('진행 정보를 저장하지 못했어요. 다시 시도해 주세요.');
      setToastVisible(true);
    } finally {
      nextInFlightRef.current = false;
    }
  }, [
    isRequiredChecked,
    navigateToWhere,
    agreeTerms,
    agreePrivacy,
    agreeMarketing,
    user.userId,
    user.name,
    user.birth,
    phoneVerified,
    dispatch,
  ]);

  const renderCheckBox = checked => (
    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
      {checked && (
        <Text allowFontScaling={false} style={styles.checkIcon}>
          ✓
        </Text>
      )}
    </View>
  );

  const handleOpenDetail = useCallback(type => {
    setDetailType(type);
    bottomSheetRef.current?.present();
  }, []);

 /**
 * detailType -> title/body 매핑
 */
  const DETAIL_MAP = useMemo(
    () => ({
      terms: {
        title: termsOfService?.title || '서비스 이용약관',
        body: TERMS_TEXT,
      },
      privacy: {
        title: privacyPolicy?.title || '개인정보 처리방침',
        body: PRIVACY_TEXT,
      },
      marketing: {
        title: '마케팅 정보 수신 동의',
        body: MARKETING_TEXT,
      },
    }),
    [],
  );

  const dismissTermsDetailSheet = useCallback(() => {
    bottomSheetRef.current?.dismiss?.();
  }, []);

  const renderDetailContent = useCallback(() => {
    if (!detailType) return null;

    const {title, body} = DETAIL_MAP[detailType] || {title: '', body: ''};

    return (
      <>
        <View style={styles.sheetHeaderRow}>
          <View style={styles.sheetHeaderSide} />
          <Text
            allowFontScaling={false}
            style={styles.sheetTitle}
            numberOfLines={2}>
            {title}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={BOTTOM_SHEET_BUTTON_LABELS.CLOSE_SHEET}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
            activeOpacity={0.75}
            onPress={dismissTermsDetailSheet}
            style={styles.sheetHeaderClose}>
            <SheetHeaderCloseIcon size={getResponsiveIconSize(16)} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.sheetScroll}>
          <Text allowFontScaling={false} style={styles.sheetBody}>
            {body}
          </Text>
        </ScrollView>
      </>
    );
  }, [detailType, DETAIL_MAP, dismissTermsDetailSheet]);

  const renderBackdrop = useCallback(
    props => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text
        allowFontScaling={false}
        style={styles.title}>{`Kinover 사용을 위해\n약관에 동의해 주세요`}</Text>
      <Text allowFontScaling={false} style={styles.sub}>
        서비스 이용을 위해 필수 약관에 동의해 주세요.
      </Text>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{paddingBottom: 24}}>
        {/* 전체 동의 */}
        <View style={[styles.row, styles.allRow]}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.rowLeft}
            onPress={handleToggleAll}>
            {renderCheckBox(agreeAll)}
            <Text allowFontScaling={false} style={styles.allText}>
              전체 동의
            </Text>
          </TouchableOpacity>
          <Text allowFontScaling={false} style={styles.allRightText}>
            필수 · 선택 모두 동의
          </Text>
        </View>

        <View style={styles.divider} />

        {/* 서비스 이용약관 */}
        <View style={styles.row}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.rowLeft}
            onPress={() => handleToggleItem('terms')}>
            {renderCheckBox(agreeTerms)}
            <View>
              <View style={styles.labelRow}>
                <Text allowFontScaling={false} style={styles.itemText}>
                  서비스 이용약관 동의
                </Text>
                <Text allowFontScaling={false} style={styles.requiredTag}>
                  (필수)
                </Text>
              </View>
              <Text allowFontScaling={false} style={styles.descText}>
                서비스 이용에 필요한 기본 규정이에요.
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleOpenDetail('terms')}>
            <Text allowFontScaling={false} style={styles.detailText}>
              보기
            </Text>
          </TouchableOpacity>
        </View>

        {/* 개인정보 처리방침 */}
        <View style={styles.row}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.rowLeft}
            onPress={() => handleToggleItem('privacy')}>
            {renderCheckBox(agreePrivacy)}
            <View>
              <View style={styles.labelRow}>
                <Text allowFontScaling={false} style={styles.itemText}>
                  개인정보 처리방침 동의
                </Text>
                <Text allowFontScaling={false} style={styles.requiredTag}>
                  (필수)
                </Text>
              </View>
              <Text allowFontScaling={false} style={styles.descText}>
                개인정보 처리 방식과 보관 기간을 안내해요.
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleOpenDetail('privacy')}>
            <Text allowFontScaling={false} style={styles.detailText}>
              보기
            </Text>
          </TouchableOpacity>
        </View>

        {/* 마케팅 정보 수신 */}
        <View style={styles.row}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.rowLeft}
            onPress={() => handleToggleItem('marketing')}>
            {renderCheckBox(agreeMarketing)}
            <View>
              <View style={styles.labelRow}>
                <Text allowFontScaling={false} style={styles.itemText}>
                  마케팅 정보 수신 동의
                </Text>
                <Text allowFontScaling={false} style={styles.optionalTag}>
                  (선택)
                </Text>
              </View>
              <Text allowFontScaling={false} style={styles.descText}>
                이벤트·새 기능 소식을 받을 수 있어요.
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleOpenDetail('marketing')}>
            <Text allowFontScaling={false} style={styles.detailText}>
              보기
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomActionButton
        useAppFontScaling={false}
        label="동의하고 계속하기"
        onPress={handleNext}
        disabled={!isRequiredChecked}
      />

      <ToastModal
        visible={toastVisible}
        message={toastMessage}
        onClose={() => setToastVisible(false)}
        duration={1200}
      />

      <BottomSheetModal
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{
          backgroundColor: 'rgba(156,163,175,0.45)',
          width: getResponsiveWidth(48),
          height: getResponsiveHeight(4),
        }}>
        <View style={styles.sheetContainer}>{renderDetailContent()}</View>
      </BottomSheetModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: 24, backgroundColor: '#FFFFFF'},
  title: {
    color: 'black',
    fontSize: 26,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 6,
  },
  sub: {color: '#6B7280', marginBottom: 24, fontSize: 13},
  scroll: {flex: 1},
  row: {
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  allRow: {justifyContent: 'space-between'},
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: {backgroundColor: '#FFC84D', borderColor: '#FFC84D'},
  checkIcon: {color: '#FFFFFF', fontSize: 12, fontWeight: '700'},
  allText: {fontSize: 15, fontWeight: '700', color: 'black'},
  allRightText: {fontSize: 11, color: COLORS.textTertiary},
  divider: {height: 1, backgroundColor: '#E5E7EB', marginVertical: 10},
  labelRow: {flexDirection: 'row', alignItems: 'center'},
  itemText: {fontSize: 14, fontWeight: '600', color: 'black'},
  requiredTag: {marginLeft: 6, fontSize: 11, color: '#DC2626'},
  optionalTag: {marginLeft: 6, fontSize: 11, color: '#6B7280'},
  descText: {marginTop: 2, fontSize: 11, color: '#6B7280'},
  detailText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    textDecorationLine: 'underline',
  },
  sheetContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  sheetHeaderSide: {
    width: 30,
  },
  sheetTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: 'black',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  sheetHeaderClose: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: getResponsiveHeight(-4),
  },
  sheetScroll: {marginTop: 4},
  sheetBody: {fontSize: 13, lineHeight: 18, color: '#111827'},
});
