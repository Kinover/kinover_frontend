import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {useNavigateToWhere} from 'hooks/useNatigateToWhere';
import BottomActionButton from 'components/BottomActionButton';

export default function UserSetupScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birth, setBirth] = useState('');
  const [error, setError] = useState('');

  const navigateToWhere = useNavigateToWhere();

  const handleSubmit = () => {
    if (!name || !phone || !birth) {
      setError('필수 항목을 모두 입력해 주세요.');
      return;
    }

    if (!/^[0-9]{9,13}$/.test(phone.replace(/-/g, ''))) {
      setError('휴대전화번호를 숫자만 정확히 입력해 주세요.');
      return;
    }

    setError('');

    const userInfo = {name, phone, birth};
    console.log('유저 정보:', userInfo);

    navigateToWhere({
      root: 'Auth',
      screen: '가족설정화면',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{`가족 연결을 위해
몇 가지 정보가 필요해요`}</Text>
      <Text style={styles.sub}>Kinover에서 사용할 정보를 입력해주세요.</Text>

      {/* 이름 */}
      <View style={styles.field}>
        <Text style={styles.label}>이름 *</Text>
        <TextInput
          style={styles.input}
          placeholder="이름을 입력하세요"
          value={name}
          onChangeText={setName}
        />
      </View>

      {/* 휴대전화번호 */}
      <View style={styles.field}>
        <Text style={styles.label}>휴대전화번호 *</Text>
        <TextInput
          style={styles.input}
          placeholder="01012345678"
          value={phone}
          onChangeText={setPhone}
          keyboardType="number-pad"
        />
      </View>

      {/* 생년월일 */}
      <View style={styles.field}>
        <Text style={styles.label}>생년월일 *</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={birth}
          onChangeText={setBirth}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <BottomActionButton label="완료하기" onPress={handleSubmit} />
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
    fontSize: 24,
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
    color:'black',
    fontSize: 15,
    marginBottom: 6,
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
