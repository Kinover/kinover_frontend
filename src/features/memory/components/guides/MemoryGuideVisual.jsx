// src/features/memory/components/MemoryGuideVisual.jsx
// 추억 탭 가이드: 흰 게시물 카드 하이라이트 + 탭 리플 + 말풍선 (시안 구조)
import React, {useEffect, useRef} from 'react';
import {View, StyleSheet, Animated, Easing} from 'react-native';
import {
  getResponsiveHeight,
  getResponsiveWidth,
} from 'utils/responsive';
import {CalloutBubble} from 'components/modal/GuideModal';

const CARD_R = 16;
const TAP_RIPPLE_SIZE = 44;

export default function MemoryGuideVisual({
  variant = 'timeline',
  step,
}) {
  const tap = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    tap.setValue(0);
    pulse.setValue(0);
    const tapLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(tap, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(600),
        Animated.timing(tap, {toValue: 0, duration: 1, useNativeDriver: true}),
      ]),
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 700,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    tapLoop.start();
    pulseLoop.start();
    return () => {
      tapLoop.stop();
      pulseLoop.stop();
    };
  }, [variant, tap, pulse]);

  const tapScale = tap.interpolate({inputRange: [0, 1], outputRange: [0.6, 2.0]});
  const tapOpacity = tap.interpolate({inputRange: [0, 1], outputRange: [0.35, 0]});
  const pulseScale = pulse.interpolate({inputRange: [0, 1], outputRange: [1, 1.08]});
  const pulseOpacity = pulse.interpolate({inputRange: [0, 1], outputRange: [0.5, 0]});

  const isPostStep = variant === 'timeline';
  const isUploadStep = variant === 'upload';
  const isFilterStep = variant === 'filter';

  return (
    <View style={styles.wrap}>
      <View style={styles.scene}>
        <View style={styles.fakeHeader}>
          <Animated.View style={[styles.filterPill, isFilterStep && {transform: [{scale: pulseScale}]}]} />
          <View style={styles.filterPill} />
          <View style={styles.filterPillSmall} />
        </View>

        <Animated.View
          style={[
            styles.postCard,
            isPostStep && {transform: [{scale: pulseScale}]},
          ]}>
          <View style={styles.cardImages}>
            <View style={styles.imgMain} />
            <View style={styles.imgRow}>
              <View style={styles.imgSmall} />
              <View style={styles.imgSmall} />
              <View style={styles.imgSmall} />
            </View>
          </View>
          <View style={styles.cardDate} />
          <View style={styles.cardLine} />
          <View style={styles.cardLineShort} />
          {isPostStep && (
            <View style={styles.tapAnchor} pointerEvents="none">
              <Animated.View
                style={[
                  styles.tapRipple,
                  {transform: [{scale: tapScale}], opacity: tapOpacity},
                ]}
              />
              <View style={styles.tapCenter} />
            </View>
          )}
        </Animated.View>

        {isUploadStep && (
          <View style={styles.fabWrap}>
            <Animated.View
              style={[
                styles.fabPulse,
                {transform: [{scale: pulseScale}], opacity: pulseOpacity},
              ]}
            />
            <View style={styles.fab}>
              <View style={styles.fabIcon} />
            </View>
          </View>
        )}
      </View>

      {(step?.title != null || step?.description != null) && (
        <CalloutBubble
          title={step.title}
          description={step.description}
          style={styles.calloutWrap}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: getResponsiveWidth(340),
  },
  scene: {
    paddingHorizontal: getResponsiveWidth(20),
  },
  fakeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(10),
    marginBottom: getResponsiveHeight(14),
  },
  filterPill: {
    width: getResponsiveWidth(56),
    height: getResponsiveHeight(32),
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  filterPillSmall: {
    width: getResponsiveWidth(28),
    height: getResponsiveHeight(28),
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: getResponsiveWidth(CARD_R),
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.08)',
    overflow: 'visible',
    padding: getResponsiveWidth(12),
  },
  cardImages: {
    flexDirection: 'row',
    gap: getResponsiveWidth(6),
    marginBottom: getResponsiveHeight(10),
  },
  imgMain: {
    flex: 1.2,
    aspectRatio: 1.1,
    borderRadius: getResponsiveWidth(10),
    backgroundColor: '#E5E7EB',
  },
  imgRow: {
    flex: 1,
    gap: getResponsiveWidth(4),
  },
  imgSmall: {
    flex: 1,
    borderRadius: getResponsiveWidth(6),
    backgroundColor: '#E5E7EB',
  },
  cardDate: {
    width: '50%',
    height: getResponsiveHeight(10),
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    marginBottom: getResponsiveHeight(8),
  },
  cardLine: {
    width: '90%',
    height: getResponsiveHeight(10),
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    marginBottom: getResponsiveHeight(6),
  },
  cardLineShort: {
    width: '70%',
    height: getResponsiveHeight(9),
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  tapAnchor: {
    position: 'absolute',
    right: getResponsiveWidth(20),
    bottom: getResponsiveHeight(56),
    width: TAP_RIPPLE_SIZE,
    height: TAP_RIPPLE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tapRipple: {
    position: 'absolute',
    width: TAP_RIPPLE_SIZE,
    height: TAP_RIPPLE_SIZE,
    borderRadius: TAP_RIPPLE_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  tapCenter: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(17,24,39,0.2)',
  },
  fabWrap: {
    position: 'absolute',
    right: getResponsiveWidth(20),
    bottom: getResponsiveHeight(20),
    width: getResponsiveWidth(52),
    height: getResponsiveWidth(52),
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabPulse: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    backgroundColor: '#111827',
  },
  fab: {
    width: getResponsiveWidth(52),
    height: getResponsiveWidth(52),
    borderRadius: 999,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabIcon: {
    width: getResponsiveWidth(24),
    height: getResponsiveWidth(24),
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  calloutWrap: {
    marginTop: getResponsiveHeight(20),
    alignSelf: 'stretch',
  },
});
