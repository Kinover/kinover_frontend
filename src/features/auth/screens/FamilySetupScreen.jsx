// src/features/auth/screens/FamilySetupScreen.js

import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useDispatch} from 'react-redux';

import ToastModal from 'components/modal/ToastModal';
import BottomActionButton from 'components/BottomActionButton';

// 변경: addUserToFamily 제거, join/create-and-join 사용
import {
  fetchFamilyThunk,
  joinFamilyThunk,
  createFamilyAndJoinThunk,
} from 'features/home/store/familyThunk';

import {
  validateLength,
  required,
} from 'utils/validation';
import {COLORS} from 'styles/style';

export default function FamilySetupScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const [familyCode, setFamilyCode] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [creating, setCreating] = useState(false);

  const showToast = useCallback(msg => {
    setToastMessage(msg);
    setToastVisible(true);
  }, []);

  const isJoinDisabled = !familyCode.trim();

  const handleSubmit = async () => {
    const trimmed = familyCode.trim();

    const requiredResult = required(trimmed, '가족 코드');
    if (!requiredResult.valid) {
      setFieldError(requiredResult.message);
      showToast(requiredResult.message);
      return;
    }

    const lengthResult = validateLength(trimmed, {min: 1, max: 50});
    if (!lengthResult.valid) {
      setFieldError(lengthResult.message);
      showToast(lengthResult.message);
      return;
    }

    setFieldError('');

    try {
      await dispatch(fetchFamilyThunk(trimmed));

 // 2) 참여 (토큰 유저로 서버가 처리)
      await dispatch(joinFamilyThunk(trimmed));

      console.log('🎉 가족 참여 성공');
      navigation.navigate('설정완료화면', {familyId: trimmed});
    } catch (err) {
      const msg =
        err?.message ||
        err?.response?.data?.message ||
        '가족 참여 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.';

      console.log('❌ 가족 참여 실패:', msg);
      setFieldError(msg);
      showToast(msg);
    }
  };

 // 새 가족 생성 + 자동 참여 (한 방)
  const handleCreateFamily = async () => {
    if (creating) return;
    setCreating(true);

    try {
      const newFamilyId = await dispatch(createFamilyAndJoinThunk());

 // thunk 구현에 따라 familyId가 문자열로 오거나, 객체로 올 수도 있으니 안전 처리
      const id =
        typeof newFamilyId === 'string'
          ? newFamilyId
          : newFamilyId?.familyId || null;

      if (!id) {
        const msg = '가족 생성에 실패했어요. 잠시 후 다시 시도해 주세요.';
        showToast(msg);
        return;
      }

      console.log('🎉 새 가족 생성+참여 성공, familyId:', id);

 // create-and-join에서 이미 setFamily까지 했으면 fetchFamily는 굳이 안 해도 됨
 // 그래도 확실히 하고 싶으면 아래 주석 해제
 // await dispatch(fetchFamilyThunk(id));

      navigation.navigate('설정완료화면', {familyId: id});
    } catch (err) {
      const msg =
        err?.message ||
        err?.response?.data?.message ||
        '가족을 만드는 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.';

      console.log('❌ 새 가족 생성/참여 실패:', msg);
      showToast(msg);
    } finally {
      setCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Text allowFontScaling={false} style={styles.title}>{`가족과 연결되려면
가족 코드가 필요해요`}</Text>
      <Text allowFontScaling={false} style={styles.sub}>
        이미 초대받았다면 코드를 입력해주세요.
      </Text>

      <View style={styles.field}>
        <Text allowFontScaling={false} style={styles.label}>
          가족 코드{' '}
          <Text allowFontScaling={false} style={styles.star}>
 *
          </Text>
        </Text>
        <TextInput
          allowFontScaling={false}
          style={styles.input}
          placeholder="가족 코드를 입력하세요"
          placeholderTextColor="#9E9E9E"
          value={familyCode}
          onChangeText={setFamilyCode}
          autoCapitalize="none"
        />
      </View>

      {fieldError ? (
        <Text allowFontScaling={false} style={styles.error}>
          {fieldError}
        </Text>
      ) : null}

      <BottomActionButton
        label="참여하기"
        onPress={handleSubmit}
        disabled={isJoinDisabled}
      />

      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <Text allowFontScaling={false} style={styles.dividerText}>
          또는
        </Text>
        <View style={styles.divider} />
      </View>

      <TouchableOpacity
        style={styles.createCard}
        activeOpacity={0.85}
        onPress={handleCreateFamily}
        disabled={creating}>
        <View style={styles.createCardIconBox}>
          <Text allowFontScaling={false} style={styles.createCardIcon}>
            🏡
          </Text>
        </View>
        <View style={styles.createCardTextBox}>
          <Text allowFontScaling={false} style={styles.createCardTitle}>
            {'새 가족 모임 만들기'}
          </Text>
          <Text allowFontScaling={false} style={styles.createCardDesc}>
            내가 방장이 되어 가족을 초대할게요
          </Text>
        </View>
        <Text allowFontScaling={false} style={styles.createCardArrow}>
          ›
        </Text>
      </TouchableOpacity>

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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 26,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 8,
    fontSize: 11,
    color: COLORS.textTertiary,
  },

  createCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  createCardIconBox: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    marginRight: 12,
  },
  createCardIcon: {
    fontSize: 22,
  },
  createCardTextBox: {
    flex: 1,
  },
  createCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  createCardDesc: {
    fontSize: 12,
    color: '#6B7280',
  },
  createCardArrow: {
    fontSize: 18,
    color: COLORS.textTertiary,
    marginLeft: 8,
  },
});
