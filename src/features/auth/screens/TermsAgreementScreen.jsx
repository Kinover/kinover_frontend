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
import ToastModal from 'components/ToastModal'; // ✅ 토스트 컴포넌트
import { COLORS } from 'styles/style';

// ✅ 서비스 이용약관
const TERMS_TEXT = `Kinover 서비스 이용약관

제1조 (목적)

본 약관은 Kinover(이하 “회사”)가 제공하는 모바일 애플리케이션 서비스(이하 “서비스”)의 이용에 관한 조건 및 절차, 이용자의 권리·의무 및 책임 사항 등 기본적인 사항을 규정함을 목적으로 합니다.

제2조 (약관의 효력 및 변경)

본 약관은 서비스 초기 화면 또는 기타 방법을 통해 게시함으로써 효력을 발생합니다.
회사는 관련 법령 또는 서비스 운영상 필요한 경우 본 약관을 변경할 수 있으며, 변경된 약관은 최소 7일 전 공지 후 효력이 발생합니다.
이용자가 변경된 약관에 동의하지 않을 경우, 서비스 이용을 중단하고 탈퇴할 수 있으며, 계속 이용 시 변경된 약관에 동의한 것으로 간주합니다.

제3조 (계정 생성 및 관리)

이용자는 카카오, 애플 등 소셜 로그인 방식으로 계정을 생성하며, 인증 절차를 거쳐 서비스를 이용할 수 있습니다.
다음의 경우 회사는 계정 생성을 제한하거나 삭제할 수 있습니다.
- 타인의 정보를 도용한 경우
- 동일 사용자가 복수 계정을 생성한 경우
- 허위 정보 기재 또는 서비스 질서를 현저히 해치는 경우
- 이전에 약관 위반으로 이용 정지 또는 탈퇴된 전력이 있는 경우

계정은 본인만 사용 가능하며, 타인에게 양도하거나 공유할 수 없습니다. 로그인 연동 계정이 변경된 경우 고객센터를 통해 업데이트를 요청할 수 있습니다.

제4조 (이용자의 의무)

이용자는 서비스 이용 시 다음 사항을 준수해야 합니다.
- 약관 및 관계 법령 준수
- 타인의 권리, 명예, 개인정보 침해 금지
- 허위 정보 또는 유해 콘텐츠 게시 금지
- 서비스의 정상 운영 방해 행위 금지
- 가족 구성원을 포함한 모든 사용자에 대한 예의와 존중

제5조 (서비스 이용 제한)

회사는 다음과 같은 행위에 대해 사전 통지 없이 이용을 제한하거나 계정을 정지, 탈퇴 처리할 수 있습니다.
- 서비스에 비정상적으로 접근하거나 시스템을 악용하는 경우
- 타인의 정보를 무단 수집, 이용 또는 유포하는 경우
- 서비스 목적과 무관하게 영리 활동, 광고, 홍보 등으로 이용하는 경우
- 관련 법령 및 회사의 정책을 위반하는 경우

제6조 (개인정보 보호)

회사는 이용자의 개인정보를 관련 법령 및 [개인정보 처리방침]에 따라 안전하게 보호하며, 동의받은 목적과 범위 내에서만 처리합니다.

제7조 (게시물의 저작권 및 관리)

이용자가 서비스에 등록한 콘텐츠(게시물, 사진 등)의 저작권은 해당 이용자에게 귀속됩니다.
회사는 서비스 운영 및 홍보 목적 범위 내에서 게시물을 검색, 노출, 편집, 복제할 수 있습니다.
불법·유해 콘텐츠 또는 권리 침해 게시물은 당사자 요청 또는 자체 판단에 따라 삭제할 수 있습니다.
게시물의 외부 활용은 이용자의 별도 동의를 통해 이루어집니다.

제8조 (서비스 중단)

회사는 서비스의 안정적 제공을 위해 시스템 점검, 업데이트, 긴급 상황 발생 시 서비스 제공을 일시 중단할 수 있으며, 가능한 경우 사전에 고지합니다.
불가피한 사정(천재지변, 시스템 장애 등)으로 사전 고지가 불가능한 경우, 사후에 통지할 수 있습니다.

제9조 (이용계약 해지)

이용자는 앱 내 설정 메뉴를 통해 언제든지 계정 탈퇴 요청이 가능하며, 회사는 이를 지체 없이 처리합니다.
탈퇴 시 작성한 게시물 및 데이터는 삭제되나, 다른 사용자에 의해 공유되었거나 저장된 데이터는 삭제되지 않을 수 있습니다.
법령에 따라 일부 정보는 일정 기간 보관될 수 있습니다.

제10조 (책임의 제한)

회사는 법적 허용 범위 내에서 서비스에 대한 명시적 또는 묵시적 보증을 하지 않으며, “있는 그대로” 서비스를 제공합니다.
회사는 이용자의 귀책 사유로 인한 손해에 대해 책임을 지지 않으며, 간접적·우발적 손해에 대해서도 책임을 지지 않습니다.

제11조 (약관의 변경)

회사는 법령 또는 서비스 운영상 필요한 경우 본 약관을 개정할 수 있으며, 개정 시 사전 공지를 통해 고지합니다.
변경된 약관은 공지일로부터 7일 후 효력을 발생하며, 이용자가 변경 내용에 동의하지 않을 경우 서비스 이용을 중단할 수 있습니다.

제12조 (이용자의 권리)

이용자는 자신의 개인정보에 대해 열람, 정정, 삭제, 처리 정지를 요청할 수 있습니다.
권리 행사는 앱 내 문의 기능 또는 이메일 등을 통해 가능합니다.

제13조 (준거법 및 분쟁 해결)

본 약관 및 서비스 이용과 관련한 분쟁은 대한민국 법률을 준거법으로 하며, 회사와 이용자 간 분쟁은 민사소송법에 따른 관할 법원에서 해결합니다.
약관 조항 중 일부가 무효로 판단되더라도, 나머지 조항은 계속 유효합니다.

제14조 (고지 및 의견 접수)

회사는 중요한 사항을 앱 내 공지사항 또는 초기 화면을 통해 고지합니다.
이용자는 서비스 내 문의 기능을 통해 언제든 의견을 제시하거나 문의할 수 있습니다.

공고일자: 2025년 7월 15일
시행일자: 공지일로부터 7일 후
`;

// ✅ 개인정보 처리방침
const PRIVACY_TEXT = `개인정보 처리방침

제1조 (목적)

Kinover(이하 “회사”)는 이용자의 개인정보를 소중히 여기며, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」, 「개인정보 보호법」 등 관련 법령을 준수하여 개인정보를 안전하게 처리하고 있습니다.

본 개인정보 처리방침은 회사가 제공하는 가족 전용 소셜네트워크 서비스(이하 “서비스”)와 관련하여, 이용자의 개인정보 수집·이용 목적 및 처리 방식, 보호조치에 대해 설명합니다.

회사는 이용자의 동의 없이 개인정보를 수집하거나 제3자에게 제공하지 않으며, 다음과 같은 경우에만 예외적으로 정보를 제공합니다.
- 이용자가 사전에 명시적으로 동의한 경우
- 법령에 따른 수사·조사 목적 등으로 관계기관의 요청이 있는 경우

이러한 경우에도 회사는 관련 법령에 따라 제공받는 자, 제공 목적, 보유 기간 등을 사전 고지하고, 별도의 동의를 받습니다.

제2조 (개인정보의 수집 및 이용 목적)

회사는 다음과 같은 목적을 위해 개인정보를 수집 및 이용합니다.
- 서비스 제공 및 운영 관리: 회원 식별, 가족 구성원 연결, 게시물 및 댓글 관리 등
- 고객 지원: 문의 응대, 오류 해결, 민원 처리
- 개선 및 분석: 기능 개선, 이용 행태 분석 등 서비스 품질 향상
- 마케팅 및 이벤트 알림 (선택 동의): 서비스 관련 소식, 프로모션 안내
- 법적 의무 이행: 관련 법령 준수, 분쟁 대응

제3조 (개인정보 수집 항목)

회사는 다음과 같은 정보를 수집할 수 있습니다.
- 회원 가입 시: 닉네임, 이메일 주소(또는 소셜 로그인 정보), 프로필 사진
- 서비스 이용 시: 게시물 및 댓글 정보, 가족 그룹 정보, 접속 일시, 이용 로그, 디바이스 정보(OS, 화면 크기, 고유 식별자 등), IP 주소, 쿠키
- 고객 응대 시: 이메일, 문의 내용, 필요시 추가 식별 정보

제4조 (개인정보 수집 방법)

- 서비스 회원가입 및 이용 중 이용자가 직접 입력하거나, 소셜 로그인 연동 시 자동 수신
- 고객센터를 통한 문의 및 피드백
- 앱 이용 과정에서 자동 수집되는 기술적 정보(접속기기, 브라우저 정보 등)

제5조 (개인정보 보유 및 파기)

회사는 수집한 개인정보를 아래와 같이 보유하고, 보유 목적 달성 시 즉시 안전하게 파기합니다.

1. 내부 방침에 의한 보유
- 부정 이용 기록: 부정 이용 및 재가입 방지 목적, 1년
- 게시물 및 댓글 기록: 서비스 연속성 유지, 분쟁 예방 목적, 5년

2. 법령에 따른 보유
- 소비자 불만 및 분쟁 처리 기록: 전자상거래법에 따라 3년
- 접속 기록(IP 등): 통신비밀보호법에 따라 3개월

3. 파기 방법
- 전자 파일: 복구 불가능한 기술적 조치로 삭제
- 출력물: 파쇄 또는 소각

제6조 (개인정보 제3자 제공 및 위탁)

회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 단, 다음과 같은 경우는 예외입니다.
- 이용자가 명시적으로 사전에 동의한 경우
- 법령에 따라 수사기관 또는 정부기관이 요청하는 경우

또한, 일부 서비스 운영을 위해 클라우드 서비스나 알림 발송 등 일부 처리를 위탁할 수 있으며, 이 경우 관련 정보를 고지하고 필요한 보호조치를 취합니다.

제7조 (쿠키 사용 안내)

회사는 맞춤형 서비스를 제공하기 위해 쿠키를 사용할 수 있습니다. 사용자는 웹 브라우저 설정을 통해 쿠키 저장을 거부하거나 삭제할 수 있습니다.
- Chrome: 설정 > 개인정보 및 보안 > 쿠키 및 기타 사이트 데이터
- Edge: 설정 > 쿠키 및 사이트 권한

제8조 (이용자의 권리)

이용자는 언제든지 개인정보 조회, 수정, 동의 철회(탈퇴) 요청이 가능합니다.
앱 내 설정 > 계정 관리 > 탈퇴하기 메뉴를 통해 직접 탈퇴하거나, 이메일 또는 고객지원 채널을 통해 요청할 수 있습니다.

제9조 (개인정보 문의처)

Kinover는 이용자의 개인정보 보호를 위해 책임자를 지정하고 있습니다.
- 책임자: 박지윤
- 이메일: kinover.service@gmail.com

제10조 (개인정보 처리방침 변경)

본 방침은 법령 변경 또는 서비스 개선에 따라 개정될 수 있으며, 개정 시 사전 고지 후 시행됩니다. 변경 사항은 앱 또는 웹사이트 내 공지사항을 통해 안내합니다.

공고일자: 2025년 7월 15일
시행일자: 공고 후 7일 경과 시점부터 효력 발생
`;

// ✅ 마케팅 동의
const MARKETING_TEXT = `마케팅 정보 수신 동의 (선택)

1. 발송 내용
- 서비스 신규 기능 및 업데이트 안내
- 이벤트, 프로모션, 할인 혜택 안내
- 이용 패턴을 바탕으로 한 맞춤형 콘텐츠 추천

2. 발송 방법
- 앱 푸시 알림
- 기타 서비스 내 알림 기능

3. 동의 철회
이용자는 언제든지 앱 내 알림 설정 또는 고객 문의를 통해
마케팅 정보 수신 동의를 철회할 수 있습니다.
동의하지 않더라도 서비스 기본 기능 이용에는 제한이 없습니다.
`;

// 약관 버전
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
  const snapPoints = useMemo(() => ['70%'], []);

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
    if (agreeTerms && agreePrivacy && agreeMarketing) {
      setAgreeAll(true);
    } else {
      setAgreeAll(false);
    }
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
      {checked && <Text style={styles.checkIcon}>✓</Text>}
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
        <Text style={styles.sheetTitle}>{title}</Text>
        <ScrollView style={styles.sheetScroll}>
          <Text style={styles.sheetBody}>{body}</Text>
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
        style={styles.title}>{`킨오버 사용을 위해\n약관에 동의해 주세요`}</Text>
      <Text style={styles.sub}>
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
            <Text style={styles.allText}>전체 동의</Text>
          </TouchableOpacity>
          <Text style={styles.allRightText}>필수 · 선택 모두 동의</Text>
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
                <Text style={styles.itemText}>서비스 이용약관 동의</Text>
                <Text style={styles.requiredTag}>(필수)</Text>
              </View>
              <Text style={styles.descText}>
                서비스 이용에 필요한 기본 규정이에요.
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleOpenDetail('terms')}>
            <Text style={styles.detailText}>보기</Text>
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
                <Text style={styles.itemText}>개인정보 처리방침 동의</Text>
                <Text style={styles.requiredTag}>(필수)</Text>
              </View>
              <Text style={styles.descText}>
                개인정보 처리 방식과 보관 기간을 안내해요.
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleOpenDetail('privacy')}>
            <Text style={styles.detailText}>보기</Text>
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
                <Text style={styles.itemText}>마케팅 정보 수신 동의</Text>
                <Text style={styles.optionalTag}>(선택)</Text>
              </View>
              <Text style={styles.descText}>
                이벤트·새 기능 소식을 받을 수 있어요.
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleOpenDetail('marketing')}>
            <Text style={styles.detailText}>보기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomActionButton
        label="동의하고 계속하기"
        onPress={handleNext}
        disabled={!isRequiredChecked}
      />

      {/* 토스트 */}
      <ToastModal
        visible={toastVisible}
        message={toastMessage}
        onClose={() => setToastVisible(false)}
        duration={1200}
      />

      {/* 상세 모달 */}
      <BottomSheetModal
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
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
  detailText: {fontSize: 12, color: COLORS.textTertiary, textDecorationLine: 'underline'},
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
