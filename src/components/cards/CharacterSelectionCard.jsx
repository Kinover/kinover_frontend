import React from 'react';
import { View, StyleSheet, Image, Platform, TouchableWithoutFeedback } from 'react-native';

import AppText from 'components/AppText';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from 'utils/responsive';
import {FONTS} from 'styles/typography';
import {useColors, useIsDark} from 'hooks/useColors';

export default function CharacterSelectionCard({
  imageSource,
  label,
  onPress,
  isSelected = false,
  width,
  height,
  showLabel = true,
  cardStyle,
  imageStyle,
  labelStyle,
  selectedLabelStyle,
}) {
  const colors = useColors();
  const isDark = useIsDark();

  const styles = useScaledStyleSheet(
    rf => ({
  card: {
    borderRadius: getResponsiveIconSize(22),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfacePrimary,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: isDark ? 0.2 : 0.04,
          shadowRadius: 4,
        }
      : {
          elevation: 0,
        }),
  },
  cardSelected: {
    backgroundColor: isDark ? 'rgba(255, 200, 77, 0.16)' : '#FFF8E6',
    borderColor: colors.brandPrimary,
  },
  image: {
    width: getResponsiveWidth(60),
    height: getResponsiveWidth(60),
    marginBottom: getResponsiveHeight(8),
  },
  label: {
    fontSize: rf(13.5),
    fontFamily: FONTS.REGULAR,
    color: colors.textSecondary,
  },
  labelSelected: {
    fontFamily: FONTS.BOLD,
    color: colors.textPrimary,
  },

  }),
    [colors, isDark],
  );
  const body = (
    <View
      style={[
        styles.card,
        width ? {width} : null,
        height ? {height} : null,
        isSelected ? styles.cardSelected : null,
        cardStyle,
      ]}>
      <Image source={imageSource} style={[styles.image, imageStyle]} resizeMode="contain" />

      {showLabel ? (
        <AppText
          allowFontScaling={false}
          style={[
            styles.label,
            isSelected ? styles.labelSelected : null,
            labelStyle,
            isSelected ? selectedLabelStyle : null,
          ]}>
          {label}
        </AppText>
      ) : null}
    </View>
  );

  if (!onPress) return body;

  return <TouchableWithoutFeedback onPress={onPress}>{body}</TouchableWithoutFeedback>;
}

