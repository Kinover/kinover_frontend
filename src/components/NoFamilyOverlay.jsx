import React, {useMemo} from 'react';
import {View, StyleSheet} from 'react-native';
import AppText from 'components/AppText';
import {useColors} from 'hooks/useColors';
import {FONTS} from 'styles/typography';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
} from 'utils/responsive';

export default function NoFamilyOverlay({bottomInset = 0}) {
  const colors = useColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
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
          backgroundColor: colors.surfacePrimary,
          borderRadius: getResponsiveWidth(20),
          paddingHorizontal: getResponsiveWidth(24),
          paddingTop: getResponsiveHeight(28),
          paddingBottom: getResponsiveHeight(28),
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
          color: colors.textPrimary,
          marginBottom: getResponsiveHeight(10),
          textAlign: 'center',
        },
        desc: {
          fontFamily: FONTS.REGULAR,
          fontSize: getResponsiveFontSize(13),
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: getResponsiveHeight(20),
          marginBottom: getResponsiveHeight(12),
        },
      }),
    [colors],
  );

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
        </View>
      </View>
    </View>
  );
}
