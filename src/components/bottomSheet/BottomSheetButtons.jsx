import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import SpringPressable from 'components/SpringPressable';
import {useThemeStyleTokens} from 'hooks/useColors';
import AppText from 'components/AppText';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from 'utils/responsive';
import {BOTTOM_SHEET_BUTTON_LABELS} from 'constants/bottomSheetTitles';

// 햅틱 유틸 (아까 만든/쓰는 파일)
import {hapticLight, hapticSuccess, hapticError} from 'utils/haptic';
import {FONTS} from 'styles/typography';

export function BottomSheetButtons({
  onCancel,
  onSave,
  cancelLabel = BOTTOM_SHEET_BUTTON_LABELS.CANCEL,
  saveLabel = BOTTOM_SHEET_BUTTON_LABELS.SAVE_ACTION,
  /** 하단 취소는 숨기고 헤더 ×·백드롭으로 닫기 (삭제 등 보조 액션은 `showCancel`) */
  showCancel = false,
  bottomSheetRef,
  autoCloseOnSave = true,
  saveButtonStyle,
  cancelButtonStyle,
  cancelTextStyle,
  buttonRowStyle,
  saveDisabled = false,
}) {
  const {BUTTON_STYLES, colors} = useThemeStyleTokens();
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
        <SpringPressable
          style={[
            styles.button,
            {
              backgroundColor: BUTTON_STYLES.cancelBg,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              borderRadius: BUTTON_STYLES.border_radius,
            },
            cancelButtonStyle,
            cancelLabel === BOTTOM_SHEET_BUTTON_LABELS.DELETE && {
              backgroundColor: '#FFFFFF',
              borderColor: '#EF4444',
            },
          ]}
          onPress={handleCancelPress}
          disabled={saving}
          activeOpacity={0.85}>
          <AppText
            allowFontScaling={false}
            style={[
              styles.buttonText,
              {color: colors.textStrong},
              styles.cancelButtonText,
              cancelTextStyle,
              cancelLabel === BOTTOM_SHEET_BUTTON_LABELS.DELETE && {
                color: '#EF4444',
              }, // 추가
            ]}>
            {cancelLabel}
          </AppText>
        </SpringPressable>
      )}

      <SpringPressable
        style={[
          styles.button,
          {
            backgroundColor: colors.brandPrimary,
            borderRadius: BUTTON_STYLES.border_radius,
          },
          saveButtonStyle,
          saving && styles.saveButtonBusy,
          saveDisabled && !saving && styles.saveButtonDisabled,
        ]}
        onPress={handleSavePress}
        disabled={saving || saveDisabled}
        activeOpacity={0.85}>
        <AppText
          allowFontScaling={false}
          style={[
            styles.buttonText,
            {color: colors.textOnBrandPrimary},
            saveDisabled && !saving && styles.saveButtonTextDisabled,
          ]}>
          {saving ? BOTTOM_SHEET_BUTTON_LABELS.SAVE_LOADING : saveLabel}
        </AppText>
      </SpringPressable>
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
    fontFamily: FONTS.SEMI_BOLD,
    color: '#111827',
  },
  sheetSubtitle: {
    marginTop: getResponsiveHeight(4),
    fontSize: getResponsiveFontSize(12),
    fontFamily: FONTS.REGULAR,
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
    fontFamily: FONTS.MEDIUM,
    color: '#4B5563',
  },
  fieldBlock: {
    marginBottom: getResponsiveHeight(12),
  },
  label: {
    fontSize: getResponsiveFontSize(12.5),
    fontFamily: FONTS.MEDIUM,
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
    fontFamily: FONTS.REGULAR,
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
    minHeight: getResponsiveHeight(52),
    paddingVertical: getResponsiveHeight(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** 저장/적용 불가(폼 미충족·변경 없음 등) — CTA와 시각적으로 구분 */
  saveButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  /** 제출 중: 살짝만 눌린 톤(라벨은 SAVE_LOADING으로 구분) */
  saveButtonBusy: {
    opacity: 0.92,
  },
  saveButtonTextDisabled: {
    color: '#9CA3AF',
  },
  buttonText: {
    textAlign: 'center',
    fontFamily: FONTS.MEDIUM,
    fontSize: getResponsiveFontSize(15.5),
  },
  cancelButtonText: {
    color: '#4B5563',
  },
});
