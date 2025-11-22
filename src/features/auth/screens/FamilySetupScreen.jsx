import React, {useState, useCallback} from 'react';
import {View, Text, TextInput, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useDispatch} from 'react-redux';

import ToastModal from '../../../components/ToastModal';
import BottomActionButton from 'components/BottomActionButton';
import {fetchFamilyThunk} from '../../home/store/familyThunk';

export default function FamilySetupScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const [familyCode, setFamilyCode] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = useCallback(msg => {
    setToastMessage(msg);
    setToastVisible(true);
  }, []);

  const handleSubmit = async () => {
    const trimmed = familyCode.trim();

    if (!trimmed) {
      const msg = '가족 코드를 입력해 주세요.';
      setFieldError(msg);
      showToast(msg);
      return;
    }

    setFieldError('');

    try {
      // ✅ 여기서만 실제 API 호출
      await dispatch(fetchFamilyThunk(trimmed)).unwrap();

      // 성공 시 가족 설정 완료 화면으로 이동
      navigation.navigate('설정완료화면');
    } catch (err) {
      const msg =
        typeof err === 'string'
          ? err
          : '가족 코드를 찾을 수 없어요. 다시 확인해 주세요.';
      setFieldError(msg);
      showToast(msg);
    }
  };

  const handleCreateFamily = () => {
    navigation.navigate('설정완료화면');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* 상단 타이틀 */}
      <Text style={styles.title}>{`가족과 연결되려면
가족 코드가 필요해요`}</Text>
      <Text style={styles.sub}>이미 초대받았다면 코드를 입력해주세요.</Text>

      {/* 가족 코드 입력 필드 */}
      <View style={styles.field}>
        <Text style={styles.label}>
          가족 코드 <Text style={styles.star}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="가족 코드를 입력하세요"
          value={familyCode}
          onChangeText={setFamilyCode}
          autoCapitalize="none"
        />
      </View>

      {/* 에러 메시지 (인풋 아래) */}
      {fieldError ? <Text style={styles.error}>{fieldError}</Text> : null}

      {/* 참여하기 버튼 */}
      <BottomActionButton label="참여하기" onPress={handleSubmit} />

      {/* 하단 서브 텍스트 (링크 느낌) */}
      <Text style={styles.secondaryText}>
        아직 가족 코드가 없다면{' '}
        <Text style={styles.secondaryLink} onPress={handleCreateFamily}>
          새 가족 모임을 만들어볼게요
        </Text>
      </Text>

      {/* 토스트 모달 */}
      <ToastModal
        visible={toastVisible}
        message={toastMessage}
        onClose={() => setToastVisible(false)}
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
  secondaryText: {
    marginTop: 14,
    fontSize: 13,
    textAlign: 'center',
    color: '#6B7280',
  },
  secondaryLink: {
    fontWeight: '700',
    color: '#111827',
    textDecorationLine: 'underline',
  },
});
