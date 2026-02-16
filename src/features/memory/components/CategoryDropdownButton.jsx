import React from 'react';
import {TouchableOpacity, Text, Image, StyleSheet} from 'react-native';
import {
  getResponsiveWidth,
} from 'utils/responsive';
import {HEADER_STYLES} from 'styles/style';

export default function CategoryDropdownButton({selectedTitle, onPress}) {
  return (
    <TouchableOpacity style={[styles.categoryButton]} onPress={onPress}>
      <Text allowFontScaling={false} style={styles.text}>{selectedTitle}</Text>
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
    alignContent: 'center',
    justifyContent: 'flex-start',
    height: 'auto',
    gap: getResponsiveWidth(10),
    marginLeft: getResponsiveWidth(21),
  },
  text: {
    fontFamily: 'Pretendard-Bold',
    fontSize: HEADER_STYLES().mainTitleFontSize,
    // color: '#4D4D4D',
    color: 'black',
    lineHeight: HEADER_STYLES().mainTitleLineHeight,
    textAlignVertical: 'center',
    textAlign: 'center',
  },
  icon: {
    resizeMode: 'contain',
    width: getResponsiveWidth(20),
    height: getResponsiveWidth(20),
    alignSelf: 'center',
  },
});
