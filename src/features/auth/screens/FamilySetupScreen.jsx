// src/features/auth/screens/FamilySetupScreen.js

import React, {useState, useCallback} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import CustomInput from 'components/CustomInput';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, StackActions} from '@react-navigation/native';
import ToastModal from 'components/modal/ToastModal';
import BottomActionButton from 'components/BottomActionButton';

import {
  useLazyGetFamilyQuery,
  useJoinFamilyMutation,
  useCreateFamilyAndJoinMutation,
} from 'features/home/services/homeApi';

import {validateLength, required} from 'utils/validation';
import {COLORS} from 'styles/style';
import {commitSignupProgressFinish} from 'utils/storage';

function messageFromRtkError(err, fallback) {
  const d = err?.data;
  if (typeof d === 'object' && d != null && typeof d.message === 'string') {
    const m = d.message.trim();
    if (m) return m;
  }
  if (typeof d === 'string' && d.trim()) return d.trim();
  if (typeof err?.message === 'string' && err.message.trim()) {
    return err.message.trim();
  }
  return fallback;
}

export default function FamilySetupScreen() {
  const navigation = useNavigation();

  const [triggerGetFamily] = useLazyGetFamilyQuery();
  const [joinFamily] = useJoinFamilyMutation();
  const [createFamilyAndJoin] = useCreateFamilyAndJoinMutation();

  const [familyCode, setFamilyCode] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const showToast = useCallback(msg => {
    setToastMessage(msg);
    setToastVisible(true);
  }, []);

  const isJoinDisabled = !familyCode.trim() || joining;

  const handleSubmit = async () => {
    if (joining) return;
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
    setJoining(true);

    try {
      await triggerGetFamily(trimmed).unwrap();

      // 2) 참여 (토큰 유저로 서버가 처리)
      await joinFamily(trimmed).unwrap();

      // RootScreen이 emit으로 AuthNavigator를 갈아끼우기 전에 현재 스택에서 먼저 교체해야 함.
      // (setSignupProgressStep을 먼저 호출하면 navigate가 언마운트된 네비에 걸려 이동이 무시됨)
      navigation.dispatch(
        StackActions.replace('설정완료화면', {familyId: trimmed}),
      );
      queueMicrotask(() => {
        commitSignupProgressFinish();
      });
    } catch (err) {
      const msg = messageFromRtkError(
        err,
        '가족 참여 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.',
      );

      setFieldError(msg);
      showToast(msg);
    } finally {
      setJoining(false);
    }
  };

  // 새 가족 생성 + 자동 참여 (한 방)
  const handleCreateFamily = async () => {
    if (creating) return;
    setCreating(true);

    try {
      const result = await createFamilyAndJoin().unwrap();
      const id =
        result?.familyId ?? (typeof result === 'string' ? result : null);

      if (!id) {
        const msg = '가족 생성에 실패했어요. 잠시 후 다시 시도해 주세요.';
        showToast(msg);
        return;
      }

      navigation.dispatch(StackActions.replace('설정완료화면', {familyId: id}));
      queueMicrotask(() => {
        commitSignupProgressFinish();
      });
    } catch (err) {
      const msg = messageFromRtkError(
        err,
        '가족을 만드는 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.',
      );

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
        </Text>
        <CustomInput
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
        useAppFontScaling={false}
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
