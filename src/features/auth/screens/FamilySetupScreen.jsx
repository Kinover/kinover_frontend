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
import {useDispatch, useSelector} from 'react-redux';

import ToastModal from '../../../components/ToastModal';
import BottomActionButton from 'components/BottomActionButton';

import {
  fetchFamilyThunk,
  addUserToFamily,
} from '../../home/store/familyThunk';
import {setHasFamily} from 'utils/storage';
import {useCreateFamily} from '../hooks/useCreateFamily';
import { COLORS } from 'styles/style';

export default function FamilySetupScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const userId = useSelector(state => state.user.userId);

  const [familyCode, setFamilyCode] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 새 가족 생성 훅 (내부에서 createFamilyThunk 쓰고 있을 것)
  const {
    createFamily,
    loading: createFamilyLoading,
    error: createFamilyError,
  } = useCreateFamily();

  const showToast = useCallback(msg => {
    setToastMessage(msg);
    setToastVisible(true);
  }, []);

  // ✅ 가족 코드로 기존 가족 참여하기
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
      // 1) 가족 코드로 가족 정보 조회 (여기서는 존재 여부 확인용)
      //    fetchFamilyThunk 안에서 에러 처리(setFamilyError)만 하고 throw는 안 하니까
      //    여기서는 그냥 await만 해두면 됨.
      await dispatch(fetchFamilyThunk(trimmed));

      // 2) 해당 가족에 나를 추가
      //    백엔드가 /add/{familyId}/{userId} 에서 {familyId}를 "가족코드"로 쓰는 구조라면
      //    그대로 trimmed를 familyId 자리에 넣어주면 됨.
      await dispatch(addUserToFamily(trimmed, userId));

      console.log('🎉 가족 참여 성공');
      await setHasFamily(true);

      // 필요하면 여기서 다시 가족 정보 한번 더 가져와도 됨
      // await dispatch(fetchFamilyThunk(trimmed));

      // 3) 완료 화면 이동
      navigation.navigate('설정완료화면');
    } catch (err) {
      console.log('❌ 가족 참여 실패:', err?.response || err);

      const status = err?.response?.status;
      const msg =
        status === 404
          ? '가족 코드를 찾을 수 없어요. 다시 확인해 주세요.'
          : err?.response?.data?.message ||
            err?.message ||
            '가족 참여 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.';

      setFieldError(msg);
      showToast(msg);
    }
  };

  // ✅ 새 가족 생성 + 내가 그 가족에 들어가기
  const handleCreateFamily = async () => {
    if (!userId) {
      const msg = '로그인 정보가 확인되지 않아요.';
      showToast(msg);
      return;
    }

    try {
      // 1) 새 가족 생성 (createFamily 내부에서 createFamilyThunk 호출해서 newFamilyId 리턴)
      const newFamilyId = await createFamily();

      if (!newFamilyId) {
        const msg =
          createFamilyError ||
          '가족 생성에 실패했어요. 잠시 후 다시 시도해 주세요.';
        showToast(msg);
        return;
      }

      console.log('🎉 새 가족 생성 성공, ID(or Code):', newFamilyId);

      // 2) 내가 그 가족에 추가
      await dispatch(addUserToFamily(newFamilyId, userId));

      // 3) "가족 있음" 플래그 저장
      await setHasFamily(true);

      // 4) 가족 정보 스토어에 최신화
      await dispatch(fetchFamilyThunk(newFamilyId));

      // 5) 완료 화면 이동 (+ 필요하면 familyId 넘기기)
      navigation.navigate('설정완료화면', {familyId: newFamilyId});
    } catch (err) {
      console.log('❌ 새 가족 생성/참여 실패:', err?.response || err);

      const msg =
        err?.response?.data?.message ||
        err?.message ||
        '가족을 만드는 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.';
      showToast(msg);
    }
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
          placeholderTextColor="#9E9E9E"
          value={familyCode}
          onChangeText={setFamilyCode}
          autoCapitalize="none"
        />
      </View>

      {fieldError ? <Text style={styles.error}>{fieldError}</Text> : null}

      <BottomActionButton label="참여하기" onPress={handleSubmit} />

      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>또는</Text>
        <View style={styles.divider} />
      </View>

      {/* 새 가족 모임 카드형 선택 UI */}
      <TouchableOpacity
        style={styles.createCard}
        activeOpacity={0.85}
        onPress={handleCreateFamily}
        disabled={createFamilyLoading}>
        <View style={styles.createCardIconBox}>
          <Text style={styles.createCardIcon}>🏡</Text>
        </View>
        <View style={styles.createCardTextBox}>
          <Text style={styles.createCardTitle}>{'새 가족 모임 만들기'}</Text>
          <Text style={styles.createCardDesc}>
            내가 방장이 되어 가족을 초대할게요
          </Text>
        </View>
        <Text style={styles.createCardArrow}>›</Text>
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
