// src/features/post/hooks/usePostHeaderOptions.js
import React, {useEffect} from 'react';
import {View, TouchableOpacity, Image} from 'react-native';
import {getResponsiveIconSize, getResponsiveWidth, getResponsiveHeight} from 'utils/responsive';
import {HEADER_STYLES} from 'styles/style';
import AppText from 'components/AppText';

// 기존 JSX의 <Text />를 접근성 정책 포함 AppText로 통일
const Text = AppText;

export default function usePostHeaderOptions({
  navigation,
  isChromeHidden,
  isLeavingRef,
  headerCategoryTitle,
  isOptionBusy,
  menuVisible,
  setMenuVisible,
  closeMenu,
}) {
  useEffect(() => {
    if (!navigation?.setOptions) return;

    navigation.setOptions({
      headerShown: !isChromeHidden,
      headerTransparent: true,
      headerTitle: () => (
        <Text style={styles.headerTitle}>
          {headerCategoryTitle}
        </Text>
      ),
      headerTitleAlign: 'center',
      headerStyle: {backgroundColor: 'transparent'},
      headerShadowVisible: false,
      headerTintColor: '#fff',
      headerBackground: () => <View style={{flex: 1, backgroundColor: 'transparent'}} />,

      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{paddingHorizontal: getResponsiveWidth(13)}}
          disabled={isOptionBusy}>
          <Image
            source={require('../../../assets/images/leftArrow.png')}
            style={{
              width: getResponsiveIconSize(20),
              height: getResponsiveIconSize(20),
              tintColor: '#fff',
              resizeMode: 'contain',
              opacity: isOptionBusy ? 0.6 : 1,
            }}
          />
        </TouchableOpacity>
      ),

      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            if (isChromeHidden) return;
            if (isLeavingRef?.current) return;
            if (isOptionBusy) return;

            if (menuVisible) closeMenu?.();
            else setMenuVisible?.(true);
          }}
          disabled={isOptionBusy}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
          style={{opacity: isOptionBusy ? 0.5 : 1}}>
          <Image
            source={require('../../../assets/icons/List.png')}
            style={styles.headerIcon}
          />
        </TouchableOpacity>
      ),
    });
  }, [
    navigation,
    isChromeHidden,
    isLeavingRef,
    headerCategoryTitle,
    isOptionBusy,
    menuVisible,
    setMenuVisible,
    closeMenu,
  ]);
}

const styles = {
  headerTitle: {
    fontSize: HEADER_STYLES().defaultTitleFontSize,
    fontFamily: HEADER_STYLES().defaultTitleFontFamily,
    color: '#fff',
    lineHeight: getResponsiveHeight(26),
    textAlign: 'center',
  },
  headerIcon: {
    width: HEADER_STYLES().headerRightIconWidth,
    height: HEADER_STYLES().headerRightIconHeight,
    resizeMode: 'contain',
    marginRight: HEADER_STYLES().headerRightIconRightPadding,
    tintColor: '#fff',
  },
};
