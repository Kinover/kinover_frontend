import React, {useState} from 'react';
import {View, Text, TextInput, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRoute} from '@react-navigation/native';

import {useNavigateToWhere} from 'hooks/useNatigateToWhere';
import BottomActionButton from 'components/BottomActionButton';
import {updateUserProfile} from 'api/userProfileApi';
export default function UserSetupScreen() {
  const [name, setName] = useState('');
  const [birth, setBirth] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigateToWhere = useNavigateToWhere();
  const route = useRoute();

  // 약관 params
  const {
    termsAgreed,
    privacyAgreed,
    marketingAgreed,
    termsVersion,
    privacyVersion,
    agreedAt,
    marketingAgreedAt,
  } = route.params || {};

  const handleSubmit = async () => {
    // 유효성 체크 (정식 오픈 시 켜기)
    // if (!name || !birth) {
    //   setError('필수 항목을 모두 입력해 주세요.');
    //   return;
    // }

    setError('');
    setLoading(true);

    try {
      const payload = {
        name,
        birth: formatDate(birth), // ← YYYY-MM-DD로 변환
        termsAgreed,
        privacyAgreed,
        marketingAgreed,
        termsVersion,
        privacyVersion,
        agreedAt: formatDate(new Date()), // ← 지금 날짜를 YYYY-MM-DD
        marketingAgreedAt: marketingAgreed ? formatDate(new Date()) : null,
      };

      console.log('📡 updateUserProfile payload:', payload);

      await updateUserProfile(payload);

      navigateToWhere({
        root: 'Auth',
        screen: '가족설정화면',
      });
    } catch (e) {
      console.log('❌ 프로필 업데이트 실패:', e);
      setError('정보 저장 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text
        style={
          styles.title
        }>{`가족 연결을 위해\n몇 가지 정보가 필요해요`}</Text>
      <Text style={styles.sub}>Kinover에서 사용할 정보를 입력해주세요.</Text>

      <View style={styles.field}>
        <Text style={styles.label}>
          이름 <Text style={styles.star}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="이름을 입력하세요"
          placeholderTextColor="#9E9E9E"   // ← 여기!
          value={name}
          onChangeText={setName}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>
          생년월일 <Text style={styles.star}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#9E9E9E"   // ← 여기!
          value={birth}
          onChangeText={setBirth}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <BottomActionButton
        label={loading ? '저장 중...' : '완료하기'}
        onPress={handleSubmit}
        disabled={loading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#FFFFFF',
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
  },
  error: {
    color: '#DC2626',
    marginBottom: 8,
    fontSize: 12,
  },
});

export const formatDate = date => {
  if (!date) return '';
  const d = new Date(date);

  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};
