// src/screens/auth/TermsAgreementScreen.js

import React, {useState, useEffect, useRef, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import BottomActionButton from 'components/BottomActionButton';
import {useNavigateToWhere} from 'hooks/useNatigateToWhere';
import {BottomSheetModal, BottomSheetBackdrop} from '@gorhom/bottom-sheet';
import ToastModal from 'components/modal/ToastModal';
import {COLORS} from 'styles/style';

// ✅ 추가
import {useSelector} from 'react-redux';
import {FONT_MODE} from 'store/uiSlice';
// import {FONT_MODE} from '../../store/uiSlice'; // 경로는 프로젝트에 맞게 조정해줘
// 지금 파일 위치가 src/screens/auth 라면 보통 ../../../store/uiSlice 이런 식일 수도 있어.
// 네 프로젝트에서 SettingScreen은 '../../../store/uiSlice'였으니,
// 여기선 아마 '../../store/uiSlice'가 아니라 '../../../store/uiSlice'일 확률 높음.

const TERMS_TEXT = `...`;
const PRIVACY_TEXT = `...`;
const MARKETING_TEXT = `...`;

const TERMS_VERSION = '2025-07-15';
const PRIVACY_VERSION = '2025-07-15';

export default function TermsAgreementScreen() {
  const navigateToWhere = useNavigateToWhere();

  const [agreeAll, setAgreeAll] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);

  const bottomSheetRef = useRef(null);
  const [detailType, setDetailType] = useState(null);

  // ✅ fontMode 가져오기
  const fontMode = useSelector(state => state.ui.fontMode);

  // ✅ 폰트모드에 따른 바텀시트 높이
  const snapPoints = useMemo(() => {
    if (fontMode === FONT_MODE.EXTRA_LARGE) return ['87%'];
    if (fontMode === FONT_MODE.LARGE) return ['81%'];
    return ['73%'];
  }, [fontMode]);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const isRequiredChecked = agreeTerms && agreePrivacy;

  const handleToggleAll = () => {
    const next = !agreeAll;
    setAgreeAll(next);
    setAgreeTerms(next);
    setAgreePrivacy(next);
    setAgreeMarketing(next);
  };

  const handleToggleItem = type => {
    if (type === 'terms') setAgreeTerms(prev => !prev);
    if (type === 'privacy') setAgreePrivacy(prev => !prev);
    if (type === 'marketing') setAgreeMarketing(prev => !prev);
  };

  useEffect(() => {
    if (agreeTerms && agreePrivacy && agreeMarketing) setAgreeAll(true);
    else setAgreeAll(false);
  }, [agreeTerms, agreePrivacy, agreeMarketing]);

  const handleNext = () => {
    if (!isRequiredChecked) {
      setToastMessage('필수 약관에 모두 동의해 주세요.');
      setToastVisible(true);
      return;
    }

    const now = new Date().toISOString();

    navigateToWhere({
      root: 'Auth',
      screen: '유저정보세팅화면',
      params: {
        termsAgreed: agreeTerms,
        privacyAgreed: agreePrivacy,
        marketingAgreed: agreeMarketing,
        termsVersion: TERMS_VERSION,
        privacyVersion: PRIVACY_VERSION,
        agreedAt: now,
        marketingAgreedAt: agreeMarketing ? now : null,
      },
    });
  };

  const renderCheckBox = checked => (
    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
      {checked && (
        <Text allowFontScaling={false} style={styles.checkIcon}>
          ✓
        </Text>
      )}
    </View>
  );

  const handleOpenDetail = type => {
    setDetailType(type);
    bottomSheetRef.current?.present();
  };

  const renderDetailContent = () => {
    if (!detailType) return null;

    let title = '';
    let body = '';

    if (detailType === 'terms') {
      title = '서비스 이용약관';
      body = TERMS_TEXT;
    } else if (detailType === 'privacy') {
      title = '개인정보 처리방침';
      body = PRIVACY_TEXT;
    } else {
      title = '마케팅 정보 수신 동의';
      body = MARKETING_TEXT;
    }

    return (
      <>
        <Text allowFontScaling={false} style={styles.sheetTitle}>
          {title}
        </Text>
        <ScrollView style={styles.sheetScroll}>
          <Text allowFontScaling={false} style={styles.sheetBody}>
            {body}
          </Text>
        </ScrollView>
      </>
    );
  };

  const renderBackdrop = props => (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      pressBehavior="close"
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text
        allowFontScaling={false}
        style={styles.title}>{`킨오버 사용을 위해\n약관에 동의해 주세요`}</Text>
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

        {/* 필수 약관 */}
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

        {/* 선택 동의 */}
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
        snapPoints={snapPoints} // ✅ 폰트모드 반영
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{backgroundColor: '#D1D5DB'}}>
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
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'black',
    marginBottom: 8,
  },
  sheetScroll: {marginTop: 4},
  sheetBody: {fontSize: 13, lineHeight: 18, color: '#111827'},
});
