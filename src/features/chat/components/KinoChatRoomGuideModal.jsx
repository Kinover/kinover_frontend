// src/features/chat/components/KinoChatGuideModal.tsx

import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Modal} from 'react-native';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from 'utils/responsive';
import { COLORS } from 'styles/style';

export default function KinoChatGuideModal({
  visible,
  step,
  totalSteps,
  title,
  description,
  onNext,
  onSkip,
}) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text allowFontScaling={false} style={styles.stepText}>
            {step + 1}/{totalSteps}
          </Text>

          {!!title && (
            <Text allowFontScaling={false} style={styles.title}>{title}</Text>
          )}

          <View style={styles.contentBody}>
            <Text allowFontScaling={false} style={styles.description}>{description}</Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={onSkip}>
              <Text allowFontScaling={false} style={styles.skipText}>건너뛰기</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.nextButton} onPress={onNext}>
              <Text allowFontScaling={false} style={styles.nextButtonText}>
                {step === totalSteps - 1 ? '완료' : '다음'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    fontSize: getResponsiveFontSize(11),
    fontFamily: 'Pretendard-Medium',
    color: COLORS.textTertiary,
    marginBottom: getResponsiveHeight(4),
  },
  title: {
    fontSize: getResponsiveFontSize(17),
    fontFamily: 'Pretendard-SemiBold',
    color: '#111827',
    marginBottom: getResponsiveHeight(6),
  },
  description: {
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-Regular',
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
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-Regular',
    color: COLORS.textTertiary,
  },
  nextButton: {
    paddingHorizontal: getResponsiveWidth(16),
    paddingVertical: getResponsiveHeight(8),
    borderRadius: 999,
    backgroundColor: '#FFC84D',
  },
  nextButtonText: {
    fontSize: getResponsiveFontSize(13.5),
    fontFamily: 'Pretendard-Medium',
    color: '#111827',
  },
});
