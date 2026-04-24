// src/features/chat/components/ChatRoomGuideModal.tsx

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import AppText from 'components/AppText';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {
  getResponsiveHeight,
  getResponsiveWidth,
} from 'utils/responsive';
import { COLORS } from 'styles/style';
import {FONTS} from 'styles/typography';

// 기존 JSX의 <AppText />를 접근성 정책 포함 AppText로 통일
const Text = AppText;

export default function ChatRoomGuideModal({
  visible,
  step,
  totalSteps,
  title,
  description,
  onNext,
  onSkip,
}) {
  const styles = useScaledStyleSheet(rf => ({

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: getResponsiveWidth(20),
    paddingBottom: getResponsiveHeight(26),
    justifyContent: 'center',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: getResponsiveWidth(18),
    paddingVertical: getResponsiveHeight(18),
  },
  contentBody: {
    backgroundColor: 'rgba(17, 24, 39, 0.06)',
    borderRadius: 12,
    paddingHorizontal: getResponsiveWidth(14),
    paddingVertical: getResponsiveHeight(14),
    marginBottom: getResponsiveHeight(16),
  },
  stepText: {
    fontSize: rf(11),
    fontFamily: FONTS.MEDIUM,
    color: COLORS.textTertiary,
    marginBottom: getResponsiveHeight(4),
  },
  title: {
    fontSize: rf(17),
    fontFamily: FONTS.SEMI_BOLD,
    color: '#111827',
    marginBottom: getResponsiveHeight(6),
  },
  description: {
    fontSize: rf(13),
    fontFamily: FONTS.REGULAR,
    color: '#4B5563',
    lineHeight: getResponsiveHeight(20),
    marginBottom: getResponsiveHeight(14),
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipText: {
    fontSize: rf(13),
    fontFamily: FONTS.REGULAR,
    color: COLORS.textTertiary,
  },
  nextButton: {
    paddingHorizontal: getResponsiveWidth(16),
    paddingVertical: getResponsiveHeight(8),
    borderRadius: 999,
    backgroundColor: '#FFC84D',
  },
  nextButtonText: {
    fontSize: rf(13.5),
    fontFamily: FONTS.MEDIUM,
    color: '#111827',
  },

  }));
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <AppText style={styles.stepText}>
            {step + 1}/{totalSteps}
          </AppText>

          {!!title && (
            <AppText style={styles.title}>{title}</AppText>
          )}

          <View style={styles.contentBody}>
            <AppText style={styles.description}>{description}</AppText>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={onSkip}>
              <AppText style={styles.skipText}>건너뛰기</AppText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.nextButton} onPress={onNext}>
              <AppText style={styles.nextButtonText}>
                {step === totalSteps - 1 ? '완료' : '다음'}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

