import React from 'react';
import { View, StyleSheet, Image, Platform, TouchableWithoutFeedback } from 'react-native';

import AppText from 'components/AppText';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from 'utils/responsive';
import {FONTS} from 'styles/typography';

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
  const styles = useScaledStyleSheet(rf => ({

  card: {
    borderRadius: getResponsiveWidth(14),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E8EB',
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 3},
          shadowOpacity: 0.08,
          shadowRadius: 3,
        }
      : {
          elevation: 0,
        }),
  },
  cardSelected: {
    backgroundColor: '#FFF8E6',
    borderColor: '#FFC84D',
  },
  image: {
    width: getResponsiveWidth(60),
    height: getResponsiveWidth(60),
    marginBottom: getResponsiveHeight(8),
  },
  label: {
    fontSize: rf(13.5),
    fontFamily: FONTS.REGULAR,
    color: '#333',
  },
  labelSelected: {
    fontFamily: FONTS.BOLD,
    color: '#000',
  },

  }));
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

