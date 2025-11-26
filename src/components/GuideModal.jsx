// src/features/common/guide/GuideModal.js

import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Modal} from 'react-native';
import getResponsiveFontSize, {
  getResponsiveHeight,
  getResponsiveWidth,
} from 'utils/responsive';

export default function GuideModal({
  visible,
  step,
  totalSteps,
  title,
  description,
  onNext,
  onSkip,
}) {
  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.stepText}>
            {step + 1}/{totalSteps}
          </Text>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={onSkip}>
              <Text style={styles.skipText}>건너뛰기</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.nextButton} onPress={onNext}>
              <Text style={styles.nextButtonText}>
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
  stepText: {
    fontSize: getResponsiveFontSize(11),
    fontFamily: 'Pretendard-Medium',
    color: '#9CA3AF',
    marginBottom: getResponsiveHeight(4),
  },
  title: {
    fontSize: getResponsiveFontSize(18),
    fontFamily: 'Pretendard-SemiBold',
    color: '#111827',
    marginBottom: getResponsiveHeight(6),
  },
  description: {
    fontSize: getResponsiveFontSize(14),
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
    color: '#9CA3AF',
  },
  nextButton: {
    paddingHorizontal: getResponsiveWidth(16),
    paddingVertical: getResponsiveHeight(8),
    borderRadius: 999,
    backgroundColor: '#FFC84D',
  },
  nextButtonText: {
    fontSize: getResponsiveFontSize(13.5),
    fontFamily: 'Pretendard-SemiBold',
    // color: '#111827',
    color: 'white',
  },
});
