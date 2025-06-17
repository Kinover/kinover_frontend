import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { getResponsiveHeight } from '../utils/responsive';

export default function SettingScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>설정</Text>
      {/* 알림 */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.row}>
          <Text style={styles.label}>알림</Text>
          <Text style={styles.arrow}>{'>'}</Text>
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
          <Text style={styles.value}>missionmateteam@gmail.com</Text>
        </View>
      </View>
      {/* 약관 및 정책 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>약관 및 정책</Text>
        <TouchableOpacity style={styles.row}>
          <Text style={styles.label}>서비스 이용약관</Text>
          <Text style={styles.arrow}>{'>'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row}>
          <Text style={styles.label}>개인정보처리방침</Text>
          <Text style={styles.arrow}>{'>'}</Text>
        </TouchableOpacity>
      </View>
      {/* 로그인 정보 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>로그인 정보</Text>
        <TouchableOpacity style={styles.row}>
          <Text style={styles.label}>로그아웃</Text>
          <Text style={styles.arrow}>{'>'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row}>
          <Text style={styles.label}>계정탈퇴</Text>
          <Text style={styles.arrow}>{'>'}</Text>
        </TouchableOpacity>
      </View>
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
    fontSize: 16,
    color: '#aaa',
  },
  section: {
    borderBottomWidth: 0.5,
    borderColor: '#E5E5E5',
    paddingVertical:getResponsiveHeight(10),
  },
});
