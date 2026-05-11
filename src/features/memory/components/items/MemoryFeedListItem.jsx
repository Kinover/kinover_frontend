import React, {memo, useMemo} from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import SpringPressable from 'components/SpringPressable';
import FastImage from '@d11/react-native-fast-image';
import DropShadow from 'react-native-drop-shadow';

import AppText from 'components/AppText';
import {
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from 'utils/responsive';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {TAB_SURFACE_CARD_RADIUS} from 'styles/style';
import {useColors} from 'hooks/useColors';
import {FONTS} from 'styles/typography';

const FASTIMAGE_DEFAULTS = {
  priority: FastImage.priority.normal,
  cache: FastImage.cacheControl.immutable,
};

const hashStringToHue = (text = '') => {
  const normalized = String(text).trim();
  if (!normalized) return 210;

  let hash = 0;
  for (const char of normalized) {
    hash = char.charCodeAt(0) + ((hash << 5) - hash);
    hash |= 0;
  }
  return Math.abs(hash % 360);
};

const getDynamicTagStyle = text => {
  const h = hashStringToHue(text);
  return {
    bg: `hsla(${h}, 42%, 90%, 0.62)`,
    border: `hsla(${h}, 38%, 82%, 0.88)`,
    dot: `hsla(${h}, 56%, 42%, 0.95)`,
    text: `hsla(${h}, 44%, 24%, 1)`,
  };
};

const Chip = memo(function Chip({text}) {
  if (!text) return null;

  const dynamicStyle = useMemo(() => getDynamicTagStyle(text), [text]);

  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: dynamicStyle.bg,
          borderColor: dynamicStyle.border,
        },
      ]}>
      <View style={[styles.chipDot, {backgroundColor: dynamicStyle.dot}]} />
      <AppText
        size={12.6}
        style={[styles.chipText, {color: dynamicStyle.text}]}
        numberOfLines={1}>
        {text}
      </AppText>
    </View>
  );
});

const MemoryFeedListItem = memo(function MemoryFeedListItem({
  postId,
  index,
  scaleKey,
  refreshing,
  scale,
  dateLabel,
  mediaLabel,
  bodyText,
  categoryLabel,
  firstUri,
  firstIsVideo,
  firstThumbUri,
  onPressPost,
  onPressInCard,
  onPressOutCard,
  firstPostRef,
}) {
  const colors = useColors();
  // fontMode가 바뀔 때 재계산 — StyleSheet.create()는 최초 1회 고정이라 사용 불가
  const fontStyles = useScaledStyleSheet(rf => ({
    dateText: {fontSize: rf(18), lineHeight: rf(22)},
    metaCompactText: {fontSize: rf(15.5), lineHeight: rf(19)},
    contentText: {fontSize: rf(17), lineHeight: rf(23)},
  }));

  const mediaSource = useMemo(() => {
    if (firstIsVideo && firstThumbUri) {
      return {uri: firstThumbUri, ...FASTIMAGE_DEFAULTS};
    }
    if (!firstIsVideo && firstUri) {
      return {uri: firstUri, ...FASTIMAGE_DEFAULTS};
    }
    return null;
  }, [firstUri, firstIsVideo, firstThumbUri]);

  const CardInner = (
    <View style={styles.cardShadowWrap}>
      <DropShadow style={styles.cardDropShadow}>
        <View
          ref={index === 0 ? firstPostRef : undefined}
          collapsable={index === 0 ? false : undefined}
          style={[
            styles.cardOuter,
            {
              backgroundColor: colors.surfacePrimary,
              borderColor: colors.borderSubtle,
            },
          ]}>
          <SpringPressable
            activeOpacity={1}
            onPressIn={() => onPressInCard(scaleKey)}
            onPressOut={() => onPressOutCard(scaleKey)}
            onPress={() => onPressPost(postId)}
            style={styles.cardPress}>
            <View style={styles.cardHeader}>
              <AppText style={[styles.dateText, fontStyles.dateText, {color: colors.textPrimary}]}>
                {dateLabel}
              </AppText>
              <AppText
                style={[styles.metaCompactText, fontStyles.metaCompactText, {color: colors.textDefault}]}>
                {mediaLabel}
              </AppText>
            </View>

            <View style={[styles.mediaWrap, {backgroundColor: colors.borderSubtle}]}>
              {mediaSource ? (
                <FastImage
                  fallback={true}
                  style={[styles.mediaImg, {backgroundColor: colors.surfaceMuted}]}
                  source={mediaSource}
                  resizeMode={FastImage.resizeMode.cover}
                />
              ) : (
                <View style={[styles.mediaPlaceholder, {backgroundColor: colors.surfaceMuted}]} />
              )}

              {firstIsVideo && (
                <View pointerEvents="none" style={styles.playCenter}>
                  <View style={styles.playCircle}>
                    <View style={styles.playTriangle} />
                  </View>
                </View>
              )}

              <Chip text={categoryLabel} />
            </View>

            <View style={styles.contentArea}>
              {bodyText ? (
                <AppText
                  style={[styles.contentText, fontStyles.contentText, {color: colors.textPrimary}]}
                  numberOfLines={3}
                  ellipsizeMode="tail">
                  {bodyText}
                </AppText>
              ) : null}
            </View>
          </SpringPressable>
        </View>
      </DropShadow>
    </View>
  );

  if (refreshing || !scale) return CardInner;

  return (
    <Animated.View style={{transform: [{scale}]}}>{CardInner}</Animated.View>
  );
});

const styles = StyleSheet.create({
  cardShadowWrap: {},
  cardDropShadow: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.045,
    shadowRadius: 20,
    elevation: 1,
  },
  cardOuter: {
    borderRadius: TAB_SURFACE_CARD_RADIUS(),
    overflow: 'visible',
    borderWidth: StyleSheet.hairlineWidth * 2,
    marginBottom: getResponsiveHeight(22),
    marginHorizontal: '3%',
    paddingHorizontal: getResponsiveWidth(22),
    paddingVertical: getResponsiveHeight(27),
  },
  cardPress: {width: '100%'},
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: getResponsiveHeight(7),
  },
  metaCompactText: {
    // fontSize/lineHeight → fontStyles.metaCompactText (useScaledStyleSheet)
    fontFamily: FONTS.HANDWRITING,
    textAlignVertical: 'bottom',
    marginLeft: getResponsiveWidth(8),
  },
  dateText: {
    // fontSize/lineHeight → fontStyles.dateText (useScaledStyleSheet)
    fontFamily: FONTS.HANDWRITING,
    textAlignVertical: 'bottom',
    letterSpacing: 0.2,
  },
  mediaWrap: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: getResponsiveIconSize(2),
    overflow: 'hidden',
    position: 'relative',
  },
  mediaImg: {
    width: '100%',
    height: '100%',
  },
  mediaPlaceholder: {
    width: '100%',
    height: '100%',
  },
  playCenter: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playCircle: {
    width: getResponsiveWidth(54),
    height: getResponsiveWidth(54),
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 20,
    borderTopWidth: 12,
    borderBottomWidth: 12,
    borderLeftColor: 'rgba(255,255,255,0.95)',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 3,
  },
  chip: {
    position: 'absolute',
    top: getResponsiveHeight(10),
    right: getResponsiveWidth(10),
    zIndex: 3,
    maxWidth: getResponsiveWidth(128),
    minHeight: getResponsiveHeight(22),
    borderRadius: 999,
    paddingHorizontal: getResponsiveWidth(9),
    paddingVertical: getResponsiveHeight(3.5),
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipDot: {
    width: getResponsiveWidth(5),
    height: getResponsiveWidth(5),
    borderRadius: 99,
    marginRight: getResponsiveWidth(4.5),
  },
  chipText: {
    // fontSize → AppText size={10.8} prop
    fontFamily: FONTS.SEMI_BOLD,
    letterSpacing: 0.1,
    flexShrink: 1,
  },
  contentArea: {
    paddingHorizontal: 0,
    paddingTop: getResponsiveHeight(14),
  },
  contentText: {
    // fontSize/lineHeight → fontStyles.contentText (useScaledStyleSheet)
    fontFamily: FONTS.HANDWRITING,
    letterSpacing: 0.1,
  },
});

export default MemoryFeedListItem;
