/* eslint-disable react-native/no-inline-styles */
// src/screens/memory/components/PostFilterBar.jsx

import React, {useMemo, useRef, useEffect} from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
} from 'react-native';

import AppText from 'components/AppText';
import {
  getResponsiveWidth,
  getResponsiveHeight,
} from 'utils/responsive';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';

import {COLORS} from 'styles/style';
import {FONTS} from 'styles/typography';

const FILTER_CONTROL_H = getResponsiveHeight(34);

export default React.forwardRef(function PostFilterBar(
  {
    categoryTitle = '카테고리',
    categoryOpen = false,
    onPressCategory,
    periodLabel,
    onPressFilterSettings,
    sortActive = false,
  },
  ref,
) {
  // fontMode가 바뀔 때 재계산 — StyleSheet.create()는 최초 1회 고정이라 사용 불가
  const fontStyles = useScaledStyleSheet(rf => ({
    categoryText: {fontSize: rf(12), lineHeight: rf(17)},
  }));

  const isCategoryActive = !!categoryTitle && categoryTitle !== '카테고리';
  const isPeriodActive = !!periodLabel;

  const categoryArrow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(categoryArrow, {
      toValue: categoryOpen ? 1 : 0,
      duration: 160,
      useNativeDriver: true,
    }).start();
  }, [categoryOpen, categoryArrow]);

  const categoryArrowStyle = useMemo(
    () => ({
      transform: [
        {
          rotate: categoryArrow.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '180deg'],
          }),
        },
      ],
    }),
    [categoryArrow],
  );

  // tone — 흰색 배경 + 얇은 테두리로 회색 페이지 배경 위에서도 버튼이 뚜렷하게 보이도록
  const INACTIVE_BG = '#F3F4F6';
  const INACTIVE_BORDER = '#F3F4F6';
  const INACTIVE_TEXT = '#111827';
  const INACTIVE_ICON = '#6B7280';

  return (
    <>
      <View ref={ref} style={styles.container}>
        {/* Category: pill로 “통일”하지 말고, 드롭다운 트리거처럼 자연스럽게 */}
        <TouchableOpacity
          style={[
            styles.categoryButton,
            {
              backgroundColor: INACTIVE_BG,
              borderColor: INACTIVE_BORDER,
            },
          ]}
          onPress={onPressCategory}
          activeOpacity={0.75}>
          <AppText
            style={[
              styles.categoryText,
              fontStyles.categoryText,
              {color: INACTIVE_TEXT},
            ]}
            numberOfLines={1}
            ellipsizeMode="tail">
            {categoryTitle}
          </AppText>
          <Animated.Image
            source={require('assets/icons/down-arrow.png')}
            style={[
              styles.categoryCaret,
              {
                tintColor: INACTIVE_ICON,
              },
              categoryArrowStyle,
            ]}
          />
          {isCategoryActive ? <View style={styles.activeDotBadge} /> : null}
        </TouchableOpacity>

        {/* Filters */}
        <View style={styles.rightControls}>
          <TouchableOpacity
            style={[
              styles.settingBtn,
              {
                backgroundColor: INACTIVE_BG,
                borderColor: INACTIVE_BORDER,
              },
            ]}
            activeOpacity={0.75}
            onPress={onPressFilterSettings}>
            <Image
              source={require('assets/icons/tabs/4/setting.png')}
              style={styles.settingIcon}
            />
            {isPeriodActive || sortActive ? (
              <View style={styles.activeDotBadge} />
            ) : null}
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveWidth(5),
    paddingTop: getResponsiveHeight(5),
    paddingBottom: getResponsiveHeight(5),
  },

  /* Category = 트리거 느낌 */
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(6),
    maxWidth: getResponsiveWidth(160),
    height: FILTER_CONTROL_H,
    borderRadius: 999,
    borderWidth: 0,
    borderColor: COLORS.borderSubtle,
    backgroundColor: COLORS.surfaceSecondary,
    paddingVertical: 0,
    paddingLeft: getResponsiveWidth(10),
    paddingRight: getResponsiveWidth(9),
  },
  categoryText: {
    // fontSize/lineHeight → fontStyles.categoryText (useScaledStyleSheet)
    fontFamily: FONTS.MEDIUM,
    color: COLORS.textTertiary,
  },
  categoryTextActive: {
    fontFamily: FONTS.SEMI_BOLD,
    color: COLORS.textPrimary,
  },
  categoryCaret: {
    resizeMode: 'contain',
    width: getResponsiveWidth(14),
    height: getResponsiveWidth(14),
  },

  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(0),
  },
  settingBtn: {
    width: FILTER_CONTROL_H,
    height: FILTER_CONTROL_H,
    borderRadius: 999,
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingIcon: {
    width: getResponsiveWidth(14),
    height: getResponsiveWidth(14),
    resizeMode: 'contain',
  },

  activeDotBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
