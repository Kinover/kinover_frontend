import React, {useEffect, useState, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import CustomInput from 'components/CustomInput';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRoute} from '@react-navigation/native';

import DatePicker from 'react-native-date-picker';

import {useNavigateToWhere} from 'hooks/useNavigateToWhere';
import BottomActionButton from 'components/BottomActionButton';
import {updateUserProfile} from 'api/userProfileApi';
import {required, validateLength} from 'utils/validation';
export default function UserSetupScreen() {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState(null); // Date | null
  const [isBirthPickerOpen, setIsBirthPickerOpen] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigateToWhere = useNavigateToWhere();
  const route = useRoute();

  const {
    termsAgreed,
    privacyAgreed,
    marketingAgreed,
    termsVersion,
    privacyVersion,
    agreedAt,
    marketingAgreedAt,
  } = route.params || {};

 // 버튼 활성/비활성 조건
  const isFormValid = name.trim().length > 0 && !!birthDate;
  const isButtonDisabled = loading || !isFormValid;

  const openBirthPicker = useCallback(() => {
    setError('');
    setIsBirthPickerOpen(true);
  }, []);

  const birthText = useMemo(() => {
    return birthDate ? formatDate(birthDate) : '';
  }, [birthDate]);

  const handleSubmit = useCallback(async () => {
    if (!termsAgreed || !privacyAgreed) {
      setError('필수 약관 동의 후 진행해 주세요.');
      return;
    }

    const nameTrimmed = name.trim();
    const requiredResult = required(nameTrimmed, '이름');
    if (!requiredResult.valid) {
      setError(requiredResult.message);
      return;
    }
    const lengthResult = validateLength(nameTrimmed, {min: 1, max: 30});
    if (!lengthResult.valid) {
      setError(lengthResult.message);
      return;
    }

    if (!birthDate) {
      setError('생년월일을 선택해 주세요.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const payload = {
        name: nameTrimmed,
        birth: formatDate(birthDate), // YYYY-MM-DD
        termsAgreed,
        privacyAgreed,
        marketingAgreed,
        termsVersion,
        privacyVersion,
        agreedAt: formatDate(agreedAt || new Date()),
        marketingAgreedAt: marketingAgreed
          ? formatDate(marketingAgreedAt || new Date())
          : null,
      };


      await updateUserProfile(payload);

      navigateToWhere({
        root: 'Auth',
        screen: '가족설정화면',
      });
    } catch (e) {
      setError('정보 저장 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  }, [
    termsAgreed,
    privacyAgreed,
    isFormValid,
    name,
    birthDate,
    marketingAgreed,
    termsVersion,
    privacyVersion,
    agreedAt,
    marketingAgreedAt,
    navigateToWhere,
  ]);

 // 진입 자체를 막기
  useEffect(() => {
    if (!termsAgreed || !privacyAgreed) {
      Alert.alert(
        '안내',
        '필수 약관에 동의 후 진행해 주세요.',
        [
          {
            text: '확인',
            onPress: () => {
              navigateToWhere({
                root: 'Auth',
                screen: '약관동의화면',
              });
            },
          },
        ],
        {cancelable: false},
      );
    }
  }, [termsAgreed, privacyAgreed, navigateToWhere]);

 // DatePicker 범위
  const maxDate = new Date();
  const minDate = new Date(1900, 0, 1);

  return (
    <SafeAreaView style={styles.container}>
      <Text allowFontScaling={false} style={styles.title}>
        {`가족 연결을 위해\n몇 가지 정보가 필요해요`}
      </Text>
      <Text allowFontScaling={false} style={styles.sub}>
        Kinover에서 사용할 정보를 입력해주세요.
      </Text>

      <View style={styles.field}>
        <Text allowFontScaling={false} style={styles.label}>
          이름 <Text allowFontScaling={false} style={styles.star}>*</Text>
        </Text>

        <CustomInput
          allowFontScaling={false}
          style={styles.input}
          placeholder="이름을 입력하세요"
          placeholderTextColor="#9E9E9E"
          value={name}
          onChangeText={text => {
            setName(text);
            if (error) setError('');
          }}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="done"
        />
      </View>

      <View style={styles.field}>
        <Text allowFontScaling={false} style={styles.label}>
          생년월일 <Text allowFontScaling={false} style={styles.star}>*</Text>
        </Text>

        {/* 생년월일: 누르면 DatePicker 모달 */}
        <TouchableOpacity activeOpacity={0.9} onPress={openBirthPicker}>
          <View style={styles.birthBox}>
            <Text
              allowFontScaling={false}
              style={[
                styles.birthText,
                !birthText && styles.birthPlaceholder,
              ]}>
              {birthText || '생년월일을 선택하세요'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {error ? (
        <Text allowFontScaling={false} style={styles.error}>
          {error}
        </Text>
      ) : null}

      <BottomActionButton
        useAppFontScaling={false}
        label={loading ? '저장 중...' : '완료하기'}
        onPress={handleSubmit}
        disabled={isButtonDisabled}
      />

      {/* DatePicker Modal */}
      <DatePicker
        modal
        open={isBirthPickerOpen}
        date={birthDate || new Date(2000, 0, 1)}
        mode="date"
        title="생년월일 선택"
        confirmText="확인"
        cancelText="취소"
        maximumDate={maxDate}
        minimumDate={minDate}
        locale="ko"
        onConfirm={date => {
          setIsBirthPickerOpen(false);
          setBirthDate(date);
        }}
        onCancel={() => {
          setIsBirthPickerOpen(false);
        }}
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

 // 이름 input
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },

 // 생년월일 박스
  birthBox: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  birthText: {
    fontSize: 14,
    color: '#111827',
  },
  birthPlaceholder: {
    color: '#9E9E9E',
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
