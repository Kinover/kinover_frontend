import React, {useMemo} from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import AppText from 'components/AppText';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
} from 'utils/responsive';
import BottomActionButton from 'components/BottomActionButton';
import {FONTS} from 'styles/typography';
import {useColors} from 'hooks/useColors';

const ANDROID_NAV_BAR_FALLBACK = 48;

export default function SelectionFrameLayout({
  title,
  subtitle,
  backgroundColor,
  headerExtra = null,
  actionLabel = '선택 완료',
  onActionPress,
  /** BottomActionButton 배경·글자색 (미지정 시 앱 기본 저장 버튼 스타일) */
  actionButtonBackgroundColor,
  actionButtonLabelColor,
  actionButtonStyle,
  actionButtonLabelStyle,
  children,
  contentStyle,
  /**
   * true면 멘트~그리드·그리드~버튼 간격을 같은 **작은 고정값**으로 두고,
   * 그리드가 flex로 남은 세로 공간을 채우게 함 (중앙 정렬로 빈 공간만 크게 쓰지 않음).
   */
  balanceVerticalSpacing = false,
}) {
  const colors = useColors();
  const resolvedBackgroundColor = backgroundColor ?? colors.surfaceSecondary;

  const styles = useScaledStyleSheet(rf => ({

  container: {
    flex: 1,
    paddingTop: getResponsiveHeight(45),
    paddingHorizontal: getResponsiveWidth(20),
  },
  header: {
    paddingHorizontal: getResponsiveWidth(6),
    alignItems: 'center',
  },
  /** balance 아님: 기존과 동일 */
  headerDefaultGap: {
    marginBottom: getResponsiveHeight(16),
  },
  /** balance: 멘트~그리드 간격 (footer와 동일 값) */
  headerBalancedGap: {
    marginBottom: getResponsiveHeight(12),
  },
  title: {
    fontSize: rf(20),
    fontFamily: FONTS.SEMI_BOLD,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: getResponsiveHeight(6),
  },
  subtitle: {
    fontSize: rf(13),
    fontFamily: FONTS.LIGHT,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    minHeight: 0,
  },
  footer: {
    paddingHorizontal: getResponsiveWidth(6),
  },
  footerSpaced: {
    paddingTop: getResponsiveHeight(16),
  },
  /** balance: 그리드~버튼 간격 = headerBalancedGap과 동일 */
  footerBalancedGap: {
    paddingTop: getResponsiveHeight(12),
  },

  }), [colors]);
  const insets = useSafeAreaInsets();

  const bottomSafe = useMemo(() => {
    const base =
      Platform.OS === 'android'
        ? Math.max(insets.bottom, getResponsiveHeight(ANDROID_NAV_BAR_FALLBACK))
        : insets.bottom;
    return base + getResponsiveHeight(16);
  }, [insets.bottom]);

  /** fixed 버튼(absolute)이 레이아웃 높이에 안 잡혀 겹침 나지 않게 — BottomActionButton bottomOffset과 동일 기준 */
  const footerMinHeight = useMemo(() => {
    const paddingTop = balanceVerticalSpacing
      ? getResponsiveHeight(12)
      : getResponsiveHeight(16);
    const buttonH = getResponsiveHeight(50);
    const absBottom = Platform.select({
      ios: getResponsiveHeight(40),
      default: getResponsiveHeight(25) + insets.bottom,
    });
    return paddingTop + buttonH + absBottom + bottomSafe;
  }, [balanceVerticalSpacing, bottomSafe, insets.bottom]);

  return (
    <View style={[styles.container, {backgroundColor: resolvedBackgroundColor}]}>
      <View
        style={[
          styles.header,
          balanceVerticalSpacing
            ? styles.headerBalancedGap
            : styles.headerDefaultGap,
        ]}>
        {headerExtra}
        <AppText allowFontScaling={false} style={styles.title}>
          {title}
        </AppText>
        <AppText allowFontScaling={false} style={styles.subtitle}>
          {subtitle}
        </AppText>
      </View>

      <View style={[styles.content, contentStyle]}>{children}</View>

      <View
        style={[
          styles.footer,
          balanceVerticalSpacing ? styles.footerBalancedGap : styles.footerSpaced,
          {paddingBottom: bottomSafe, minHeight: footerMinHeight},
        ]}>
        <BottomActionButton
          variant="fixed"
          label={actionLabel}
          onPress={onActionPress}
          backgroundColor={actionButtonBackgroundColor}
          labelColor={actionButtonLabelColor}
          buttonStyle={actionButtonStyle}
          labelStyle={actionButtonLabelStyle}
        />
      </View>
    </View>
  );
}

