// src/features/auth/screens/FamilySetupScreen.js

import React, {useState, useCallback} from 'react';
import {View, Text, TextInput, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';

import ToastModal from '../../../components/ToastModal';
import BottomActionButton from 'components/BottomActionButton';

import {fetchFamilyThunk, addUserToFamily} from '../../home/store/familyThunk';
import {setHasFamily} from 'utils/storage';

export default function FamilySetupScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const userId = useSelector(state => state.user.userId);

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

    if (!userId) {
      const msg = '로그인 정보가 확인되지 않아요.';
      showToast(msg);
      return;
    }

    setFieldError('');

    try {
      // 1) 가족 코드로 가족이 있는지 확인
      await dispatch(fetchFamilyThunk(trimmed)); // ✅ unwrap 사용 X

      // 2) 가족이 있다면 나를 가족에 추가
      await dispatch(addUserToFamily(trimmed, userId)); // ✅ unwrap 사용 X

      console.log('🎉 가족 참여 성공');
      await setHasFamily(true);

      // 3) 완료 화면 이동
      navigation.navigate('설정완료화면');
    } catch (err) {
      console.log('❌ 가족 참여 실패:', err?.response || err);

      const msg =
        err?.response?.status === 404
          ? '가족 코드를 찾을 수 없어요. 다시 확인해 주세요.'
          : err?.response?.data?.message ||
            '가족 참여 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.';

      setFieldError(msg);
      showToast(msg);
    }
  };

  const handleCreateFamily = () => {
    navigation.navigate('설정완료화면');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Text style={styles.title}>{`가족과 연결되려면
가족 코드가 필요해요`}</Text>
      <Text style={styles.sub}>이미 초대받았다면 코드를 입력해주세요.</Text>

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

      {fieldError ? <Text style={styles.error}>{fieldError}</Text> : null}

      <BottomActionButton label="참여하기" onPress={handleSubmit} />

      <Text style={styles.secondaryText}>
        아직 가족 코드가 없다면{' '}
        <Text style={styles.secondaryLink} onPress={handleCreateFamily}>
          새 가족 모임을 만들어볼게요
        </Text>
      </Text>

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
