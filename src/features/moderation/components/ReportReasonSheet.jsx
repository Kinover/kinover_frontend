/* eslint-disable react-native/no-inline-styles */
import React, {useCallback} from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  Pressable,
  StyleSheet,
} from 'react-native';
import AppText from 'components/AppText';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
} from 'utils/responsive';
import {
  REPORT_REASON_CODES,
  REPORT_REASON_LABELS,
} from '../constants/reportReasons';

export default function ReportReasonSheet({
  visible,
  onClose,
  onSelectReason,
  title = '신고 사유를 선택해 주세요',
}) {
  const handlePick = useCallback(
    code => {
      onSelectReason?.(code);
    },
    [onSelectReason],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation?.()}>
          <AppText allowFontScaling={false} style={styles.title}>
            {title}
          </AppText>
          {REPORT_REASON_CODES.map(code => (
            <TouchableOpacity
              key={code}
              style={styles.row}
              activeOpacity={0.85}
              onPress={() => handlePick(code)}>
              <AppText allowFontScaling={false} style={styles.rowLabel}>
                {REPORT_REASON_LABELS[code] ?? code}
              </AppText>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.cancelRow} onPress={onClose}>
            <AppText allowFontScaling={false} style={styles.cancelText}>
              닫기
            </AppText>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: getResponsiveWidth(24),
  },
  sheet: {
    backgroundColor: '#fff',
    borderRadius: getResponsiveWidth(14),
    paddingVertical: getResponsiveHeight(12),
    maxHeight: '72%',
  },
  title: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(16),
    color: '#111827',
    paddingHorizontal: getResponsiveWidth(18),
    paddingBottom: getResponsiveHeight(10),
  },
  row: {
    paddingVertical: getResponsiveHeight(14),
    paddingHorizontal: getResponsiveWidth(18),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(17,24,39,0.08)',
  },
  rowLabel: {
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(15),
    color: '#1F2937',
  },
  cancelRow: {
    marginTop: getResponsiveHeight(6),
    paddingVertical: getResponsiveHeight(12),
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(14),
    color: '#6B7280',
  },
});
