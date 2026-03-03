import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';

import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from 'utils/responsive';

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
        <Text
          allowFontScaling={false}
          style={[
            styles.label,
            isSelected ? styles.labelSelected : null,
            labelStyle,
            isSelected ? selectedLabelStyle : null,
          ]}>
          {label}
        </Text>
      ) : null}
    </View>
  );

  if (!onPress) return body;

  return <TouchableWithoutFeedback onPress={onPress}>{body}</TouchableWithoutFeedback>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: getResponsiveWidth(14),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.1,
    borderColor: '#EEEEEE',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.08,
    shadowRadius: 3,
    ...(Platform.OS === 'android' ? {elevation: 4} : null),
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
    fontSize: getResponsiveFontSize(13.5),
    fontFamily: 'Pretendard-Regular',
    color: '#333',
  },
  labelSelected: {
    fontFamily: 'Pretendard-Bold',
    color: '#000',
  },
});

