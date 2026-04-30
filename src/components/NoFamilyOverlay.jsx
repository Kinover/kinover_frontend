import React from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import {useFamilyJoinOrCreateSheet} from 'contexts/FamilyJoinOrCreateSheetContext';
import AppText from 'components/AppText';
import {COLORS} from 'styles/style';
import {FONTS} from 'styles/typography';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
} from 'utils/responsive';

export default function NoFamilyOverlay({bottomInset = 0}) {
  const {openFamilyJoinOrCreateSheet} = useFamilyJoinOrCreateSheet();

  const handleSetupFamily = () => {
    openFamilyJoinOrCreateSheet();
  };

  return (
    <View
      style={[
        styles.wrap,
        bottomInset > 0 ? {bottom: bottomInset} : null,
      ]}
      pointerEvents="box-none">
      <View style={styles.backdrop} pointerEvents="auto" />
      <View style={styles.cardWrap} pointerEvents="box-none">
        <View style={styles.card} pointerEvents="auto">
          <AppText allowFontScaling={false} style={styles.emoji}>
            🏡
          </AppText>
          <AppText allowFontScaling={false} style={styles.title}>
            가족 모임이 필요해요
          </AppText>
          <AppText allowFontScaling={false} style={styles.desc}>
            이 기능은 가족과 함께할 수 있어요.{'\n'}먼저 가족 모임을 만들거나
            참여해보세요.
          </AppText>
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.85}
            onPress={handleSetupFamily}>
            <AppText allowFontScaling={false} style={styles.buttonText}>
              가족 모임 시작하기
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10000,
    elevation: 10000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  cardWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '82%',
    backgroundColor: '#FFFFFF',
    borderRadius: getResponsiveWidth(20),
    paddingHorizontal: getResponsiveWidth(24),
    paddingVertical: getResponsiveHeight(32),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  emoji: {
    fontSize: 40,
    marginBottom: getResponsiveHeight(12),
  },
  title: {
    fontFamily: FONTS.SEMI_BOLD,
    fontSize: getResponsiveFontSize(18),
    color: COLORS.textPrimary,
    marginBottom: getResponsiveHeight(10),
    textAlign: 'center',
  },
  desc: {
    fontFamily: FONTS.REGULAR,
    fontSize: getResponsiveFontSize(13),
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: getResponsiveHeight(20),
    marginBottom: getResponsiveHeight(24),
  },
  button: {
    backgroundColor: COLORS.brandPrimary,
    borderRadius: getResponsiveWidth(14),
    paddingVertical: getResponsiveHeight(14),
    paddingHorizontal: getResponsiveWidth(32),
  },
  buttonText: {
    fontFamily: FONTS.MEDIUM,
    fontSize: getResponsiveFontSize(14),
    color: COLORS.textPrimary,
  },
});
