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
} from '../../utils/responsive';

export default function CategoryDropdownButton({
  selectedTitle,
  onPress,
  style,
}) {
  return (
    <TouchableOpacity style={[styles.categoryButton, style]} onPress={onPress}>
      <Text style={styles.text}>{selectedTitle}</Text>
      <Image
        source={require('../../assets/images/down-yellow.png')}
        style={styles.icon}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(10),
  },
  text: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(25),
    // color: '#FFC84D',
    color: '#FFC84D',

  },
  icon: {
    resizeMode: 'contain',
    width: getResponsiveWidth(12),
    height: getResponsiveHeight(9),
  },
});
