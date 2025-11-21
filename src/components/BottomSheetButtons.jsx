import React from 'react';
import {TouchableOpacity, View, Text, StyleSheet, Platform} from 'react-native';
import { BUTTON_STYLES } from 'styles/style';
import  {getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from 'utils/responsive';

export function BottomSheetButtons({onCancel, onSave}) {
  return (
    <View style={styles.buttonRow}>
      <TouchableOpacity
        style={[styles.button, styles.cancelButton]}
        onPress={onCancel}>
        <Text style={[styles.buttonText, styles.cancelButtonText]}>
          되돌리기
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.saveButton]}
        onPress={onSave}>
        <Text style={styles.buttonText}>저장하기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: getResponsiveWidth(22),
    paddingTop: getResponsiveHeight(14),
    paddingBottom: getResponsiveHeight(26),
  },
  headerRow: {
    marginBottom: getResponsiveHeight(12),
  },
  sheetTitle: {
    fontSize: getResponsiveFontSize(16.5),
    fontFamily: 'Pretendard-SemiBold',
    color: '#111827',
  },
  sheetSubtitle: {
    marginTop: getResponsiveHeight(4),
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-Regular',
    color: '#6B7280',
  },
  profileTouchArea: {
    width: '100%',
    alignItems: 'center',
    marginBottom: getResponsiveHeight(18),
    marginTop: getResponsiveHeight(6),
  },
  profileimageContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileRing: {
    position: 'absolute',
    borderRadius: 44,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  profileBadge: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.12,
    shadowRadius: 2,
  },
  profileBadgeIcon: {
    width: 14,
    height: 14,
  },
  profileEditText: {
    marginTop: getResponsiveHeight(6),
    fontSize: getResponsiveFontSize(12.5),
    fontFamily: 'Pretendard-Medium',
    color: '#4B5563',
  },
  fieldBlock: {
    marginBottom: getResponsiveHeight(12),
  },
  label: {
    fontSize: getResponsiveFontSize(12.5),
    fontFamily: 'Pretendard-Medium',
    color: '#4B5563',
    marginBottom: getResponsiveHeight(4),
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical:
      Platform.OS === 'android'
        ? getResponsiveHeight(7)
        : getResponsiveHeight(9),
    fontSize: getResponsiveFontSize(14),
    includeFontPadding: false,
    fontFamily: 'Pretendard-Regular',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: {
    height: getResponsiveHeight(96),
    textAlignVertical: 'top',
  },
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
    backgroundColor: BUTTON_STYLES.cancelBg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  saveButton: {
    backgroundColor: BUTTON_STYLES.saveBg,
  },
  buttonText: {
    textAlign: 'center',
    fontFamily: BUTTON_STYLES.fontFamily,
    fontSize: BUTTON_STYLES.fontSize,
    color: '#FFFFFF',
  },
  cancelButtonText: {
    color: '#4B5563',
  },
});
