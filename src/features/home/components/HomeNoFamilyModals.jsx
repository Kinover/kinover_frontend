import React, {useState, useCallback, useEffect} from 'react';
import {View, StyleSheet} from 'react-native';
import {useStore} from 'react-redux';
import CustomModal from 'components/modal/CustomModal';
import CustomInput from 'components/CustomInput';
import AppText from 'components/AppText';
import ToastModal from 'components/modal/ToastModal';

import {
  useLazyGetFamilyQuery,
  useJoinFamilyMutation,
  useCreateFamilyAndJoinMutation,
} from 'features/home/services/homeApi';

import {validateLength, required} from 'utils/validation';
import {useColors} from 'hooks/useColors';
import {
  commitSignupProgressFinish,
  getPendingInviteCodeSync,
  clearPendingInviteCode,
  clearFamilySkipFinishScreenPendingSync,
} from 'utils/storage';
import {finalizeFamilyJoinForLoggedInUser} from 'features/auth/utils/finalizeFamilyJoinForLoggedInUser';

import {
  getResponsiveHeight,
  getResponsiveFontSize,
} from 'utils/responsive';
import {FONTS} from 'styles/typography';

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

/** 홈(가족 없음): 초대 코드 입력 후 참여 — CustomModal */
export function HomeFamilyInviteJoinModal({visible, onClose}) {
  const colors = useColors();
  const store = useStore();
  const [triggerGetFamily] = useLazyGetFamilyQuery();
  const [joinFamily] = useJoinFamilyMutation();

  const [code, setCode] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [joining, setJoining] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = useCallback(msg => {
    setToastMessage(msg);
    setToastVisible(true);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const pending = getPendingInviteCodeSync();
    if (pending) {
      clearPendingInviteCode();
      setCode(pending);
    } else {
      setCode('');
    }
    setFieldError('');
  }, [visible]);

  const requestClose = useCallback(() => {
    if (joining) return;
    onClose?.();
  }, [joining, onClose]);

  const handleConfirm = useCallback(async () => {
    if (joining) return;

    const trimmed = code.trim();
    const reqResult = required(trimmed, '가족 코드');
    if (!reqResult.valid) {
      setFieldError(reqResult.message);
      showToast(reqResult.message);
      return;
    }
    const lenResult = validateLength(trimmed, {min: 1, max: 50});
    if (!lenResult.valid) {
      setFieldError(lenResult.message);
      showToast(lenResult.message);
      return;
    }

    setFieldError('');
    setJoining(true);

    try {
      await triggerGetFamily(trimmed).unwrap();
      await joinFamily(trimmed).unwrap();
      clearFamilySkipFinishScreenPendingSync();
      commitSignupProgressFinish();
      await finalizeFamilyJoinForLoggedInUser(store);
      onClose?.();
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
  }, [joining, code, triggerGetFamily, joinFamily, store, onClose, showToast]);

  return (
    <>
      <CustomModal
        visible={visible}
        onRequestClose={requestClose}
        onClose={requestClose}
        onConfirm={handleConfirm}
        confirmText={joining ? '처리 중…' : '참여하기'}
        title="초대코드로 참여"
        subText="받으신 초대 코드를 입력해 주세요."
        subTextPlacement="title"
        showCloseButton
        closeOnBackdropPress={!joining}>
        <View style={staticStyles.fieldBlock}>
          <CustomInput
            allowFontScaling={false}
            style={[staticStyles.input, {borderColor: colors.borderSubtle}]}
            placeholder="가족 코드를 입력하세요"
            placeholderTextColor="#9E9E9E"
            value={code}
            onChangeText={t => {
              setCode(t);
              if (fieldError) setFieldError('');
            }}
            autoCapitalize="none"
            editable={!joining}
          />
          {fieldError ? (
            <AppText allowFontScaling={false} style={[staticStyles.fieldError, {color: colors.error}]}>
              {fieldError}
            </AppText>
          ) : null}
        </View>
      </CustomModal>
      <ToastModal
        visible={toastVisible}
        message={toastMessage}
        onClose={() => setToastVisible(false)}
      />
    </>
  );
}

/** 홈(가족 없음): 새 가족 모임 생성 — CustomModal */
export function HomeFamilyCreateModal({visible, onClose}) {
  const store = useStore();
  const [createFamilyAndJoin] = useCreateFamilyAndJoinMutation();
  const [creating, setCreating] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = useCallback(msg => {
    setToastMessage(msg);
    setToastVisible(true);
  }, []);

  const requestClose = useCallback(() => {
    if (creating) return;
    onClose?.();
  }, [creating, onClose]);

  const handleConfirm = useCallback(async () => {
    if (creating) return;
    setCreating(true);

    try {
      const result = await createFamilyAndJoin().unwrap();
      const id =
        result?.familyId ?? (typeof result === 'string' ? result : null);

      if (!id) {
        showToast('가족 생성에 실패했어요. 잠시 후 다시 시도해 주세요.');
        return;
      }

      clearFamilySkipFinishScreenPendingSync();
      commitSignupProgressFinish();
      await finalizeFamilyJoinForLoggedInUser(store);
      onClose?.();
    } catch (err) {
      showToast(
        messageFromRtkError(
          err,
          '가족을 만드는 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.',
        ),
      );
    } finally {
      setCreating(false);
    }
  }, [creating, createFamilyAndJoin, store, onClose, showToast]);

  return (
    <>
      <CustomModal
        visible={visible}
        onRequestClose={requestClose}
        onClose={requestClose}
        onConfirm={handleConfirm}
        confirmText={creating ? '처리 중…' : '새 모임 만들기'}
        title="새 모임 만들기"
        subText={'새 가족 모임을 만들면\n초대 코드로 가족을 불러올 수 있어요.'}
        subTextPlacement="title"
        showCloseButton
        closeOnBackdropPress={!creating}
      />
      <ToastModal
        visible={toastVisible}
        message={toastMessage}
        onClose={() => setToastVisible(false)}
      />
    </>
  );
}

const staticStyles = StyleSheet.create({
  fieldBlock: {
    alignSelf: 'stretch',
    marginTop: getResponsiveHeight(4),
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: getResponsiveFontSize(14),
  },
  fieldError: {
    marginTop: getResponsiveHeight(8),
    fontSize: getResponsiveFontSize(12),
    fontFamily: FONTS.REGULAR,
  },
});
