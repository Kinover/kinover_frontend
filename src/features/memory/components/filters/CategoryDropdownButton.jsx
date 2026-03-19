import React from 'react';
import {TouchableOpacity, Image, StyleSheet} from 'react-native';
import AppText from 'components/AppText';
import {
  getResponsiveWidth,
} from 'utils/responsive';
import {HEADER_STYLES} from 'styles/style';

// 기존 JSX의 <Text />를 접근성 정책 포함 AppText로 통일
const Text = AppText;

export default function CategoryDropdownButton({selectedTitle, onPress}) {
  return (
    <TouchableOpacity style={[styles.categoryButton]} onPress={onPress}>
      <Text style={styles.text}>{selectedTitle}</Text>
      <Image
        source={require('assets/icons/category-down.png')}
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
