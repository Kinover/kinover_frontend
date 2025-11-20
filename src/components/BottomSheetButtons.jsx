// src/components/common/BottomSheetButtons.jsx (예시 경로)

import React from 'react';
import {TouchableOpacity, View, Text, StyleSheet} from 'react-native';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from 'utils/responsive';

export function BottomSheetButtons({
  onCancel,
  onSave,
  cancelLabel = '되돌리기',
  saveLabel = '저장하기',
  showCancel = true,
}) {
  return (
    <View style={styles.buttonRow}>
      {showCancel && (
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}>
          <Text style={[styles.buttonText, styles.cancelButtonText]}>
            {cancelLabel}
          </Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[styles.button, styles.saveButton]}
        onPress={onSave}>
        <Text style={styles.buttonText}>{saveLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: getResponsiveWidth(10),
    marginTop: getResponsiveHeight(18),
  },
  button: {
    flex: 1,
    paddingVertical: getResponsiveHeight(11),
    borderRadius: 9,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  saveButton: {
    backgroundColor: '#111827',
  },
  buttonText: {
    textAlign: 'center',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(14),
    color: '#FFFFFF',
  },
  cancelButtonText: {
    color: '#4B5563',
  },
});
