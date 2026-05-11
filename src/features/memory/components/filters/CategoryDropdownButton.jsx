import React from 'react';
import { Image, StyleSheet } from 'react-native';
import SpringPressable from 'components/SpringPressable';
import AppText from 'components/AppText';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {
  getResponsiveWidth,
} from 'utils/responsive';
import {HEADER_STYLES} from 'styles/style';
import {FONTS} from 'styles/typography';

// 기존 JSX의 <AppText />를 접근성 정책 포함 AppText로 통일
const Text = AppText;

export default function CategoryDropdownButton({selectedTitle, onPress}) {
  const styles = useScaledStyleSheet(rf => ({

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
    fontFamily: FONTS.BOLD,
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

  }));
  return (
    <SpringPressable style={[styles.categoryButton]} onPress={onPress}>
      <AppText style={styles.text}>{selectedTitle}</AppText>
      <Image
        source={require('assets/icons/category-down.png')}
        style={styles.icon}
      />
    </SpringPressable>
  );
}

