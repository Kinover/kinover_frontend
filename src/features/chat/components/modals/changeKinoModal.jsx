import React, {useCallback, useEffect, useRef} from 'react';
import {StyleSheet, Platform} from 'react-native';
import CustomModal from 'components/modal/CustomModal';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveWidth,
} from 'utils/responsive';

export default function ChangeKinoModal({visible, onClose, onConfirm}) {
  const styles = useScaledStyleSheet(rf => ({

  modalTitle: {
    color: 'black',
    fontSize:
      Platform.OS === 'android'
        ? rf(20)
        : rf(22),
    textAlign: 'center',
    fontFamily: 'Pretendard-SemiBold',
  },
  modalSubText: {
    textAlign: 'center',
    color: '#6E6E6E',
    fontFamily: 'Pretendard-Regular',
    fontSize:
      Platform.OS === 'android'
        ? rf(15)
        : rf(16),
    lineHeight: getResponsiveHeight(21), // 17은 너무 촘촘해서 답답해 보일 수 있어
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: getResponsiveWidth(10),
    marginTop: getResponsiveHeight(2),
  },
  confirmButton: {
    flex: 1,
    backgroundColor: 'black',
    paddingVertical: getResponsiveHeight(12.5),
    borderRadius: getResponsiveWidth(10),
  },
  closeButton: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    paddingVertical: getResponsiveHeight(12.5),
    borderRadius: getResponsiveWidth(10),
  },

  }));
 // 중복 클릭/연속 호출 방지 + 언마운트 안전 처리
  const lockedRef = useRef(false);
  const timerRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimer();
      lockedRef.current = false;
    };
  }, [clearTimer]);

 // "교체" 누르면: 모달 먼저 닫고(애니메이션), 그 다음 onConfirm 실행
  const handleConfirm = useCallback(() => {
    if (lockedRef.current) return;
    lockedRef.current = true;

    onClose?.();

    clearTimer();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      onConfirm?.();
      lockedRef.current = false;
    }, 220); // 100ms는 짧아서 iOS/Android에서 닫힘 애니랑 충돌할 수 있음
  }, [onClose, onConfirm, clearTimer]);

 // 닫기/바깥 탭으로 닫힐 때도 락 해제
  const handleClose = useCallback(() => {
    clearTimer();
    lockedRef.current = false;
    onClose?.();
  }, [onClose, clearTimer]);

  return (
    <CustomModal
      visible={visible}
      onClose={handleClose}
      showCloseButton={true}
      onConfirm={handleConfirm}
      confirmText="교체하기"
      closeText="취소하기"
      title="키노를 교체하시겠어요?"
      subText={
        '지금까지의 대화는 저장되지 않아요.\n새로운 키노와 처음부터 다시 시작해요.'
      }
 // CustomModal이 아래 props를 지원한다면 연결 (지원 안 하면 무시해도 됨)
    />
  );
}

