// src/features/schedule/components/BirthdayModal.jsx
import React, {useMemo} from 'react';
import {View, Text, StyleSheet, Platform} from 'react-native';
import CustomModal from 'components/modal/CustomModal';
import ScreenConfetti from './ScreenConfetti';
import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveFontSize,
} from 'utils/responsive';

export default function BirthdayModal({visible, onClose, namesText}) {
  const parsed = useMemo(() => {
    const raw = String(namesText || '').trim();

    // "OO, OO 외" / "OO님의 생일..." 등 들어와도 최대한 이름만 뽑기
    const cleaned = raw
      .replace(/님의\s*생일.*$/g, '')
      .replace(/\s*생일.*$/g, '')
      .trim();

    const hasEtc = raw.includes('외');

    const names = cleaned
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const first = names[0] || '가족';
    const second = names[1] || null;

    const heroNames = `${first}${second ? ` · ${second}` : ''}${
      hasEtc ? ' 외' : ''
    }`;

    return {raw, heroNames};
  }, [namesText]);

  // subText는 "상황 설명"만 짧게
  const subtitle =
    parsed.raw && parsed.raw.length > 0
      ? '오늘 일정에 생일이 있어요.'
      : '오늘 일정에 생일이 등록되어 있어요.';

  // 메시지는 1개만, 짧고 자연스럽게
  const messageText = `생일 축하해요! 🎉
오늘 하루 기분 좋은 일만 가득하길 바라요.
항상 고마워요 💛`;

  return (
    <CustomModal
      showCloseButton
      visible={visible}
      onClose={onClose}
      onConfirm={onClose}
      closeText="닫기"
      confirmText="메시지 보내기"
      title={`${parsed.heroNames} 생일`}
      subText={subtitle}
      modalBoxStyle={styles.modalBox}
      overlayChildren={
        <ScreenConfetti visible={visible} originX={0.5} originY={0.52} />
      }>
      {/* ✅ 내용은 딱 2덩어리: 안내 1줄 + 메시지 박스 */}
      <View style={styles.content}>
        <Text style={styles.noticeText}>
          짧게라도 한마디 전하면 좋아요.
        </Text>

        <View style={styles.messageBox}>
          <Text style={styles.messageLabel}>추천 문구</Text>
          <Text style={styles.messageBody}>{messageText}</Text>
        </View>
      </View>
    </CustomModal>
  );
}

const styles = StyleSheet.create({
  modalBox: {
    width: getResponsiveWidth(326),
    maxWidth: '90%',
    alignSelf: 'center',
  },

  content: {
    gap: getResponsiveHeight(10),
  },

  noticeText: {
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(12.8),
    color: '#6B7280',
    lineHeight: getResponsiveHeight(18),
  },

  messageBox: {
    borderRadius: 14,
    paddingVertical: getResponsiveHeight(12),
    paddingHorizontal: getResponsiveWidth(12),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.08)',
    shadowColor: '#000',
    shadowOpacity: Platform.OS === 'ios' ? 0.06 : 0,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 4},
    elevation: Platform.OS === 'android' ? 1 : 0,
  },

  messageLabel: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(12.2),
    color: '#111827',
    marginBottom: getResponsiveHeight(8),
  },

  messageBody: {
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(13.4),
    color: '#111827',
    lineHeight: getResponsiveHeight(20),
  },
});
