import React from 'react';
import { TouchableOpacity, View, StyleSheet, Platform } from 'react-native';
import {BUTTON_STYLES} from 'styles/style';
import AppText from 'components/AppText';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from 'utils/responsive';

// 햅틱 유틸 (아까 만든/쓰는 파일)
import {hapticLight, hapticSuccess, hapticError} from 'utils/haptic';

export function BottomSheetButtons({
  onCancel,
  onSave,
  cancelLabel = '되돌리기',
  saveLabel = '저장하기',
  showCancel = true,
  bottomSheetRef,
  autoCloseOnSave = true,
  saveButtonStyle,
  cancelButtonStyle,
  buttonRowStyle,
  saveDisabled = false,
}) {
  const [saving, setSaving] = React.useState(false);

  const handleCancelPress = () => {
    hapticLight();
    onCancel?.();
  };

  const handleSavePress = async () => {
    if (saving) return;

    try {
      setSaving(true);

 // 저장 버튼 누르는 순간(터치 피드백)
      hapticLight();

      if (onSave) {
        await onSave();
      }

 // 저장 성공 피드백
      hapticSuccess();

      if (autoCloseOnSave && bottomSheetRef?.current) {
        if (typeof bottomSheetRef.current.dismiss === 'function') {
          bottomSheetRef.current.dismiss();
        } else if (typeof bottomSheetRef.current.close === 'function') {
          bottomSheetRef.current.close();
        }
      }
    } catch (e) {
 // 저장 실패 피드백
      hapticError();
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.buttonRow, buttonRowStyle]}>
      {showCancel && (
        <TouchableOpacity
          style={[
            styles.button,
            styles.cancelButton,
            cancelButtonStyle,
            cancelLabel === '삭제하기' && {borderColor: '#EF4444'},
          ]}
          onPress={handleCancelPress}
          disabled={saving}
          activeOpacity={0.85}>
          <AppText
            allowFontScaling={false}
            style={[
              styles.buttonText,
              styles.cancelButtonText,
              cancelLabel === '삭제하기' && {color: '#EF4444'}, // 추가
            ]}>
            {cancelLabel}
          </AppText>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[
          styles.button,
          styles.saveButton,
          saveButtonStyle,
          (saving || saveDisabled) && {opacity: 0.4},
        ]}
        onPress={handleSavePress}
        disabled={saving || saveDisabled}
        activeOpacity={0.85}>
        <AppText allowFontScaling={false} style={styles.buttonText}>
          {saving ? '저장 중...' : saveLabel}
        </AppText>
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
    paddingVertical: getResponsiveHeight(14),
    borderRadius: BUTTON_STYLES().border_radius,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: BUTTON_STYLES().cancelBg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  saveButton: {
    backgroundColor: BUTTON_STYLES().saveBg,
  },
  buttonText: {
    textAlign: 'center',
    fontFamily: BUTTON_STYLES().fontFamily,
    fontSize: BUTTON_STYLES().fontSize,
    color: '#FFFFFF',
  },
  cancelButtonText: {
    color: '#4B5563',
  },
});
