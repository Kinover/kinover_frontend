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
    <TouchableOpacity style={[styles.categoryButton]} onPress={onPress}>
      <Text style={styles.text}>{selectedTitle}</Text>
      <Image
        source={require('../../../assets/icons/category-down.png')}
        style={styles.icon}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  categoryButton: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    alignContent:'center',
    justifyContent: 'flex-start',
    height:'auto',
    gap: getResponsiveWidth(10),
    marginLeft: getResponsiveWidth(31),
  },
  text: {
    fontFamily: 'Pretendard-Bold',
    fontSize: getResponsiveFontSize(24),
    color: '#4D4D4D',
    textAlign:'center',
  },
  icon: {
    resizeMode: 'contain',
    width: getResponsiveWidth(20),
    height: getResponsiveWidth(20),
    alignSelf: 'center',
  },
});
