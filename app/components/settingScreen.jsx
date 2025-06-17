import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LogoutModal from './logoutModal';
import DeleteAccountModal from './deleteAccountModal'; // ✅ 계정탈퇴 모달 import
import { getResponsiveHeight, getResponsiveIconSize } from '../utils/responsive';

export default function SettingScreen() {
  const navigation = useNavigation();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false); // ✅ 계정탈퇴 모달 상태

  const goToNotificationSettings = () => {
    navigation.navigate('알림설정화면');
  };

  const handleLogout = () => {
    console.log('🔓 로그아웃 실행');
    setShowLogoutModal(false);
  };

  const handleDeleteAccount = () => {
    console.log('⚠️ 계정탈퇴 실행');
    setShowDeleteModal(false);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>설정</Text>

      {/* 알림 */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.row} onPress={goToNotificationSettings}>
          <Text style={styles.label}>알림</Text>
          <Image
            style={styles.arrow}
            source={require('../assets/images/rightArrow-gray.png')}
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
        <TouchableOpacity style={styles.row}>
          <Text style={styles.label}>서비스 이용약관</Text>
          <Image
            style={styles.arrow}
            source={require('../assets/images/rightArrow-gray.png')}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.row}>
          <Text style={styles.label}>개인정보처리방침</Text>
          <Image
            style={styles.arrow}
            source={require('../assets/images/rightArrow-gray.png')}
          />
        </TouchableOpacity>
      </View>

      {/* 로그인 정보 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>로그인 정보</Text>
        <TouchableOpacity style={styles.row} onPress={() => setShowLogoutModal(true)}>
          <Text style={styles.label}>로그아웃</Text>
          <Image
            style={styles.arrow}
            source={require('../assets/images/rightArrow-gray.png')}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={() => setShowDeleteModal(true)}>
          <Text style={styles.label}>계정탈퇴</Text>
          <Image
            style={styles.arrow}
            source={require('../assets/images/rightArrow-gray.png')}
          />
        </TouchableOpacity>
      </View>

      {/* 로그아웃 모달 */}
      <LogoutModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />

      {/* 계정탈퇴 모달 */}
      <DeleteAccountModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
    flex: 1,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#000',
  },
  sectionTitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 10,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  label: {
    fontSize: 17,
    color: '#222',
  },
  value: {
    fontSize: 14,
    color: '#555',
  },
  arrow: {
    width: getResponsiveIconSize(12.5),
    height: getResponsiveIconSize(12.5),
    resizeMode: 'contain',
  },
  section: {
    borderBottomWidth: 0.5,
    borderColor: '#E5E5E5',
    paddingVertical: getResponsiveHeight(10),
  },
});
