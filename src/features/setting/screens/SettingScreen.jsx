import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Linking,
} from 'react-native';

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

export default function SettingScreen() {
  const navigation = useNavigation();
  const logout = useLogout();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useHideTabBar();

  const openLink = url => Linking.openURL(url).catch(err => console.error(err));

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
    paddingHorizontal: getResponsiveWidth(18), // 🔽 20 → 18
    paddingTop: getResponsiveHeight(16), // 🔽 20 → 16
    flex: 1,
  },
  header: {
    fontSize: SETTING_STYLES.titleFontSize,
    fontWeight: SETTING_STYLES.titleFontWeight,
    marginBottom: getResponsiveHeight(20), // 🔽 30 → 20
    color: SETTING_STYLES.titleFontColor,
    fontFamily: SETTING_STYLES.titleFontFamily,
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize(12.5), // 🔽 14 → 12.5
    color: '#888',
    marginTop: getResponsiveHeight(6),
    marginBottom: getResponsiveHeight(6),
    fontFamily: 'Pretendard-Medium',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: getResponsiveHeight(10), // 🔽 12 → 10
  },
  label: {
    fontSize: SETTING_STYLES.labelFontSize,
    color: SETTING_STYLES.labelFontColor,
    fontFamily: SETTING_STYLES.labelFontFamily,
  },
  value: {
    fontSize: getResponsiveFontSize(14), // 🔽 17 → 14
    color: '#555',
    fontFamily: 'Pretendard-Regular',
  },
  arrow: {
    width: getResponsiveIconSize(11), // 🔽 12.5 → 11
    height: getResponsiveIconSize(11),
    resizeMode: 'contain',
  },
  section: {
    borderBottomWidth: 0.5,
    borderColor: '#E5E5E5',
    paddingVertical: getResponsiveHeight(6), // 🔽 8 → 6
  },
});
