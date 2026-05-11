import React, {useState, useCallback, useMemo} from 'react';
import { View, StyleSheet } from 'react-native';
import SpringPressable from 'components/SpringPressable';
import {useDispatch, useStore} from 'react-redux';
import {StackActions} from '@react-navigation/native';
import CustomInput from 'components/CustomInput';
import AppText from 'components/AppText';
import ToastModal from 'components/modal/ToastModal';
import BottomActionButton from 'components/BottomActionButton';

import {
  useLazyGetFamilyQuery,
  useJoinFamilyMutation,
  useCreateFamilyAndJoinMutation,
} from 'features/home/services/homeApi';

import {validateLength, required} from 'utils/validation';
import {useColors} from 'hooks/useColors';
import {clearPhoneVerificationPending} from 'features/auth/store/loginSlice';
import {
  commitSignupProgressFinish,
  getPendingInviteCodeSync,
  clearPendingInviteCode,
  markFamilySkipFinishScreenPendingSync,
  clearFamilySkipFinishScreenPendingSync,
} from 'utils/storage';
import {finalizeFamilyJoinForLoggedInUser} from 'features/auth/utils/finalizeFamilyJoinForLoggedInUser';

function messageFromRtkError(err, fallback) {
  const d = err?.data;
  if (typeof d === 'object' && d != null && typeof d.message === 'string') {
    const m = d.message.trim();
    if (m) {
      return m;
    }
  }
  if (typeof d === 'string' && d.trim()) {
    return d.trim();
  }
  if (typeof err?.message === 'string' && err.message.trim()) {
    return err.message.trim();
  }
  return fallback;
}

/**
 * @param {Object} props
 * @param {boolean} [props.compact] 바텀시트용 작은 안내 문구
 * @param {boolean} [props.fromAppFlow] 설정완료 화면 replace 시 params
 * @param {'sheet' | 'screen'} props.surface
 * @param {() => void} [props.onSkipPress] surface가 sheet일 때 하단 ‘나중에’ 동작 (시트 닫기)
 * @param {object} [props.screenNavigation] surface가 screen일 때 스택 replace용 navigation
 */
export default function FamilyJoinOrCreateForm({
  compact = false,
  fromAppFlow = false,
  surface = 'screen',
  onSkipPress,
  onSheetSuccess,
  screenNavigation,
}) {
  const colors = useColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        screenRoot: {
          flex: 1,
        },
        sheetRoot: {
          alignSelf: 'stretch',
          paddingBottom: 8,
        },
        screenContentPadding: {
          paddingHorizontal: 24,
          paddingTop: 24,
        },
        title: {
          color: colors.textPrimary,
          fontSize: 26,
          fontWeight: '700',
          marginTop: 4,
          marginBottom: 6,
        },
        sub: {
          color: colors.textSecondary,
          marginBottom: 30,
          fontSize: 13,
        },
        compactIntro: {
          color: colors.textSecondary,
          fontSize: 13,
          lineHeight: 20,
          marginBottom: 20,
        },
        field: {
          marginBottom: 18,
        },
        label: {
          color: colors.textPrimary,
          fontSize: 15,
          marginBottom: 6,
          fontWeight: '600',
        },
        input: {
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontSize: 14,
        },
        error: {
          color: colors.error,
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
          backgroundColor: colors.borderSubtle,
        },
        dividerText: {
          marginHorizontal: 8,
          fontSize: 11,
          color: colors.textTertiary,
        },
        createCard: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderRadius: 14,
          backgroundColor: colors.surfaceSecondary,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
        },
        createCardIconBox: {
          width: 40,
          height: 40,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surfacePrimary,
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
          color: colors.textStrong,
          marginBottom: 2,
        },
        createCardDesc: {
          fontSize: 12,
          color: colors.textSecondary,
        },
        createCardArrow: {
          fontSize: 18,
          color: colors.textTertiary,
          marginLeft: 8,
        },
        skipButton: {
          alignSelf: 'center',
          marginTop: 18,
          paddingVertical: 10,
          paddingHorizontal: 16,
          borderRadius: 999,
          backgroundColor: colors.surfaceMuted,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
        },
        skipButtonText: {
          fontSize: 13,
          color: colors.textSecondary,
        },

        contentGrow: {
          flex: 1,
        },
        fixedCtaContainer: {
          paddingHorizontal: 24,
        },
      }),
    [colors],
  );

  const dispatch = useDispatch();
  const store = useStore();

  const [triggerGetFamily] = useLazyGetFamilyQuery();
  const [joinFamily] = useJoinFamilyMutation();
  const [createFamilyAndJoin] = useCreateFamilyAndJoinMutation();

  const [familyCode, setFamilyCode] = useState(() => {
    const pending = getPendingInviteCodeSync();
    if (pending) {
      clearPendingInviteCode();
      return pending;
    }
    return '';
  });
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

  const handleSkipFamily = () => {
    if (surface === 'screen') {
      markFamilySkipFinishScreenPendingSync();
      dispatch(clearPhoneVerificationPending());
      screenNavigation?.dispatch(
        StackActions.replace('설정완료화면', {
          fromAppFlow,
          skippedFamilySetup: true,
        }),
      );
      if (!fromAppFlow) {
        commitSignupProgressFinish();
      }
      return;
    }
    onSkipPress?.();
  };

  const handleSubmit = async () => {
    if (joining) {
      return;
    }
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
      await joinFamily(trimmed).unwrap();

      if (surface === 'screen') {
        screenNavigation?.dispatch(
          StackActions.replace('설정완료화면', {
            familyId: trimmed,
            fromAppFlow,
          }),
        );
        clearFamilySkipFinishScreenPendingSync();
        commitSignupProgressFinish();
      } else {
        clearFamilySkipFinishScreenPendingSync();
        commitSignupProgressFinish();
        await finalizeFamilyJoinForLoggedInUser(store);
        onSheetSuccess?.();
      }
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

  const handleCreateFamily = async () => {
    if (creating) {
      return;
    }
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

      if (surface === 'screen') {
        screenNavigation?.dispatch(
          StackActions.replace('설정완료화면', {familyId: id, fromAppFlow}),
        );
        clearFamilySkipFinishScreenPendingSync();
        commitSignupProgressFinish();
      } else {
        clearFamilySkipFinishScreenPendingSync();
        commitSignupProgressFinish();
        await finalizeFamilyJoinForLoggedInUser(store);
        onSheetSuccess?.();
      }
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
    <View style={surface === 'sheet' ? styles.sheetRoot : styles.screenRoot}>
      <View
        style={[
          styles.contentGrow,
          surface === 'screen' ? styles.screenContentPadding : null,
        ]}>
        {!compact ? (
          <>
            <AppText
              allowFontScaling={false}
              style={styles.title}>{`가족과 연결되려면\n가족 코드가 필요해요`}</AppText>
            <AppText allowFontScaling={false} style={styles.sub}>
              이미 초대받았다면 코드를 입력해주세요.
            </AppText>
          </>
        ) : (
          <AppText allowFontScaling={false} style={styles.compactIntro}>
            초대 코드가 있으면 입력해 주세요. 없으면 새 가족 모임을 만들 수 있어요.
          </AppText>
        )}

        <View style={styles.field}>
          {!compact ? (
            <AppText allowFontScaling={false} style={styles.label}>
              가족 코드{' '}
            </AppText>
          ) : null}
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
          <AppText allowFontScaling={false} style={styles.error}>
            {fieldError}
          </AppText>
        ) : null}

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <AppText allowFontScaling={false} style={styles.dividerText}>
            또는
          </AppText>
          <View style={styles.divider} />
        </View>

        <SpringPressable
          style={styles.createCard}
          activeOpacity={0.85}
          onPress={handleCreateFamily}
          disabled={creating}>
          <View style={styles.createCardIconBox}>
            <AppText allowFontScaling={false} style={styles.createCardIcon}>
              🏡
            </AppText>
          </View>
          <View style={styles.createCardTextBox}>
            <AppText allowFontScaling={false} style={styles.createCardTitle}>
              새 가족 모임 만들기
            </AppText>
            <AppText allowFontScaling={false} style={styles.createCardDesc}>
              내가 방장이 되어 가족을 초대할게요
            </AppText>
          </View>
          <AppText allowFontScaling={false} style={styles.createCardArrow}>
            ›
          </AppText>
        </SpringPressable>

        {surface === 'screen' || onSkipPress ? (
          <SpringPressable
            style={styles.skipButton}
            activeOpacity={0.85}
            onPress={handleSkipFamily}>
            <AppText allowFontScaling={false} style={styles.skipButtonText}>
              나중에 할게요
            </AppText>
          </SpringPressable>
        ) : null}
      </View>

      <BottomActionButton
        variant="fixed"
        useAppFontScaling={false}
        label="참여하기"
        onPress={handleSubmit}
        disabled={isJoinDisabled}
        containerStyle={surface === 'screen' ? styles.fixedCtaContainer : null}
      />

      <ToastModal
        visible={toastVisible}
        message={toastMessage}
        onClose={() => setToastVisible(false)}
      />
    </View>
  );
}
