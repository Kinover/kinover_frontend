// src/features/auth/hooks/useDeleteUser.js

import {useCallback, useState} from 'react';
import {Alert} from 'react-native';
import {useDispatch} from 'react-redux';
import {deleteUserThunk} from 'features/home/store/userThunk';
// 🔸 너의 실제 경로에 맞춰서 꼭 수정해줘

export function useDeleteUser(onSuccess) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  // 실제 탈퇴 실행
  const deleteAccount = useCallback(async () => {
    try {
      setLoading(true);

      const result = await dispatch(deleteUserThunk()).unwrap();

      Alert.alert('완료', '회원 탈퇴가 정상적으로 처리되었어요.');

      // 성공 후 네비게이션 이동 등 처리
      onSuccess && onSuccess(result);
    } catch (error) {
      Alert.alert(
        '오류',
        error || '회원 탈퇴 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setLoading(false);
    }
  }, [dispatch, onSuccess]);

  // 확인 모달 포함
  const confirmDeleteAccount = useCallback(() => {
    Alert.alert(
      '회원 탈퇴',
      '정말로 회원 탈퇴하시겠어요?\n탈퇴 후 정보는 복구할 수 없어요.',
      [
        {text: '취소', style: 'cancel'},
        {text: '탈퇴하기', style: 'destructive', onPress: deleteAccount},
      ],
    );
  }, [deleteAccount]);

  return {
    loading,
    deleteAccount,
    confirmDeleteAccount,
  };
}
