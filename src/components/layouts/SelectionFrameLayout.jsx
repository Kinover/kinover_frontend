import React, {useMemo} from 'react';
import {View, Text, StyleSheet, Platform} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
} from 'utils/responsive';
import BottomActionButton from 'components/BottomActionButton';

const ANDROID_NAV_BAR_FALLBACK = 48;

export default function SelectionFrameLayout({
  title,
  subtitle,
  backgroundColor = '#F9F9F9',
  headerExtra = null,
  actionLabel = '선택 완료',
  onActionPress,
  children,
  contentStyle,
}) {
  const insets = useSafeAreaInsets();

  const bottomSafe = useMemo(() => {
    const base =
      Platform.OS === 'android'
        ? Math.max(insets.bottom, getResponsiveHeight(ANDROID_NAV_BAR_FALLBACK))
        : insets.bottom;
    return base + getResponsiveHeight(16);
  }, [insets.bottom]);

  return (
    <View style={[styles.container, {backgroundColor}]}>
      <View style={styles.header}>
        {headerExtra}
        <Text allowFontScaling={false} style={styles.title}>
          {title}
        </Text>
        <Text allowFontScaling={false} style={styles.subtitle}>
          {subtitle}
        </Text>
      </View>

      <View style={[styles.content, contentStyle]}>{children}</View>

      <View style={[styles.footer, {paddingBottom: bottomSafe}]}>
        <BottomActionButton
          variant="fixed"
          label={actionLabel}
          onPress={onActionPress}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: getResponsiveHeight(45),
    paddingHorizontal: getResponsiveWidth(20),
  },
  header: {
    paddingHorizontal: getResponsiveWidth(6),
    marginBottom: getResponsiveHeight(16),
    alignItems: 'center',
  },
  title: {
    fontSize: getResponsiveFontSize(20),
    fontFamily: 'Pretendard-SemiBold',
    color: '#000',
    textAlign: 'center',
    marginBottom: getResponsiveHeight(6),
  },
  subtitle: {
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-Light',
    color: '#6B7280',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  footer: {
    paddingTop: getResponsiveHeight(16),
    paddingHorizontal: getResponsiveWidth(6),
    minHeight: getResponsiveHeight(50) + getResponsiveHeight(16),
  },
});

