import React from 'react';
import {
  TouchableOpacity,
  Text,
  Image,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import {
  getResponsiveFontSize,
  getResponsiveWidth,
  getResponsiveHeight,
} from '../../../utils/responsive';

export default function CategoryDropdownButton({
  selectedTitle,
  onPress,
  style,
}) {
  return (
    <TouchableOpacity style={[styles.categoryButton, style]} onPress={onPress}>
      <Text style={styles.text}>{selectedTitle}</Text>
      <Image
        source={require('../../../assets/images/arrow-down.png')}
        style={styles.icon}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: getResponsiveWidth(5),
    paddingBottom: getResponsiveWidth(7.5),
  },
  text: {
    fontFamily: 'Pretendard-Bold',
    fontSize: getResponsiveFontSize(22.5),
    color: '#4D4D4D',
  },
  icon: {
    resizeMode: 'contain',
    width: getResponsiveWidth(20),
    height: getResponsiveHeight(20),
  },
});
