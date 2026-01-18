/* eslint-disable react-native/no-inline-styles */
// SettingScreen.jsx (Switch -> CustomSwitch 교체)

import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Linking,
  Alert,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';

import LogoutModal from '../../home/components/LogoutModal';
import DeleteAccountModal from '../../home/components/DeleteAccountModal';

import {
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
  getResponsiveFontSize,
} from '../../../utils/responsive';
import {useLogout} from '../../auth/hooks/useLogout';
import useHideTabBar from '../../../hooks/useHideTabBar';
import {SETTING_STYLES} from 'styles/style';

import {
  checkAndAuthBiometric,
  getBiometricAvailability,
} from '../../../utils/biometrics';

// ✅ CustomSwitch import (프로젝트 경로에 맞게 수정)
import CustomSwitch from '../../../components/CustomSwitch';

const BIOMETRIC_ON_KEY = '@kinover/biometric_on_v1';

export default function SettingScreen() {
  const navigation = useNavigation();
  const logout = useLogout();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ✅ 생체인식 설정 상태
  const [bioSupported, setBioSupported] = useState(false);
  const [bioType, setBioType] = useState(null);
  const [bioOn, setBioOn] = useState(false);
  const [bioLoading, setBioLoading] = useState(true);

  useHideTabBar();

  const openLink = url => Linking.openURL(url).catch(err => console.error(err));

  const loadBiometricSetting = useCallback(async () => {
    setBioLoading(true);
    try {
      const avail = await getBiometricAvailability();
      setBioSupported(avail.available);
      setBioType(avail.biometryType);

      const raw = await AsyncStorage.getItem(BIOMETRIC_ON_KEY);
      setBioOn(raw === '1');
    } finally {
      setBioLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBiometricSetting();
  }, [loadBiometricSetting]);

  // ✅ 토글 핸들러: "다음 상태값"을 받게 유지
  const onToggleBiometric = useCallback(
    async next => {
      // OFF는 바로 허용
      if (!next) {
        await AsyncStorage.setItem(BIOMETRIC_ON_KEY, '0');
        setBioOn(false);
        return;
      }

      // ON: 지원 여부 확인
      if (!bioSupported) {
        Alert.alert('사용 불가', '이 기기에서는 생체인식을 사용할 수 없어요.');
        return;
      }

      // ON: 한번 인증 성공해야 함
      const res = await checkAndAuthBiometric();
      if (!res?.success) {
        Alert.alert('실패', '인증에 실패했어요. 다시 시도해줘요.');
        return;
      }

      await AsyncStorage.setItem(BIOMETRIC_ON_KEY, '1');
      setBioOn(true);
    },
    [bioSupported],
  );

  // ✅ CustomSwitch용: toggleSwitch는 "현재값" 기반으로 next를 만들어 호출
  const handlePressCustomSwitch = useCallback(() => {
    if (bioLoading) return; // 로딩 중엔 막기
    const next = !bioOn;
    onToggleBiometric(next);
  }, [bioLoading, bioOn, onToggleBiometric]);

  const bioLabel = bioType
    ? bioType === 'FaceID'
      ? 'Face ID로 앱 잠금'
      : bioType === 'TouchID'
      ? '지문으로 앱 잠금'
      : '생체인식으로 앱 잠금'
    : '생체인식으로 앱 잠금';

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>설정</Text>

      {/* 알림 */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('알림설정화면')}>
          <Text style={styles.label}>알림</Text>
          <Image
            style={styles.arrow}
            source={require('../../../assets/images/rightArrow-gray.png')}
          />
        </TouchableOpacity>
      </View>

      {/* ✅ 앱 잠금(생체인식) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>보안</Text>

        <View style={styles.row}>
          <View style={{flex: 1, paddingRight: getResponsiveWidth(10)}}>
            <Text style={styles.label}>{bioLabel}</Text>
            {!bioSupported && !bioLoading ? (
              <Text style={styles.hint}>이 기기에서는 사용할 수 없어요</Text>
            ) : null}
          </View>

          {/* ✅ Switch -> CustomSwitch */}
          <View style={{opacity: bioLoading ? 0.55 : 1}}>
            <CustomSwitch
              isEnabled={bioOn}
              toggleSwitch={handlePressCustomSwitch}
            />
          </View>
        </View>
      </View>

      {/* 버전 정보 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>버전정보</Text>
        <View style={styles.row}>
          <Text style={styles.label}>현재버전</Text>
          <Text style={styles.value}>1.1.0</Text>
        </View>
      </View>

      {/* 고객지원 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>고객지원</Text>
        <View style={styles.row}>
          <Text style={styles.label}>문의하기</Text>
          <Text style={styles.value}>kinover.service@gmail.com</Text>
        </View>
      </View>

      {/* 약관 및 정책 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>약관 및 정책</Text>

        <TouchableOpacity
          style={styles.row}
          onPress={() =>
            openLink('https://www.notion.so/2129f61bad50805589f6edfcac083179')
          }>
          <Text style={styles.label}>서비스 이용약관</Text>
          <Image
            style={styles.arrow}
            source={require('../../../assets/images/rightArrow-gray.png')}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() =>
            openLink('https://www.notion.so/2129f61bad5080f6bd29e269f5f319b1')
          }>
          <Text style={styles.label}>개인정보처리방침</Text>
          <Image
            style={styles.arrow}
            source={require('../../../assets/images/rightArrow-gray.png')}
          />
        </TouchableOpacity>
      </View>

      {/* 로그인 정보 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>로그인 정보</Text>

        <TouchableOpacity
          style={styles.row}
          onPress={() => setShowLogoutModal(true)}>
          <Text style={styles.label}>로그아웃</Text>
          <Image
            style={styles.arrow}
            source={require('../../../assets/images/rightArrow-gray.png')}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() => setShowDeleteModal(true)}>
          <Text style={styles.label}>계정탈퇴</Text>
          <Image
            style={styles.arrow}
            source={require('../../../assets/images/rightArrow-gray.png')}
          />
        </TouchableOpacity>
      </View>

      {/* 모달 */}
      <LogoutModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={logout}
      />
      <DeleteAccountModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: getResponsiveWidth(18),
    paddingTop: getResponsiveHeight(16),
    flex: 1,
  },
  header: {
    fontSize: SETTING_STYLES.titleFontSize,
    fontWeight: SETTING_STYLES.titleFontWeight,
    marginBottom: getResponsiveHeight(20),
    color: SETTING_STYLES.titleFontColor,
    fontFamily: SETTING_STYLES.titleFontFamily,
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize(12.5),
    color: '#888',
    marginTop: getResponsiveHeight(6),
    marginBottom: getResponsiveHeight(6),
    fontFamily: 'Pretendard-Medium',
  },
  hint: {
    marginTop: getResponsiveHeight(3),
    fontSize: getResponsiveFontSize(11.5),
    color: '#A0A0A0',
    fontFamily: 'Pretendard-Regular',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: getResponsiveHeight(10),
  },
  label: {
    fontSize: SETTING_STYLES.labelFontSize,
    color: SETTING_STYLES.labelFontColor,
    fontFamily: SETTING_STYLES.labelFontFamily,
  },
  value: {
    fontSize: getResponsiveFontSize(14),
    color: '#555',
    fontFamily: 'Pretendard-Regular',
  },
  arrow: {
    width: getResponsiveIconSize(11),
    height: getResponsiveIconSize(11),
    resizeMode: 'contain',
  },
  section: {
    borderBottomWidth: 0.5,
    borderColor: '#E5E5E5',
    paddingVertical: getResponsiveHeight(6),
  },
});
