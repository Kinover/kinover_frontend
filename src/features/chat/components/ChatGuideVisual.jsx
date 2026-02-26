// src/features/chat/components/ChatGuideVisual.jsx
// 소통 탭 가이드: FAB 하이라이트 + 탭 리플 + 말풍선 (시안 구조)
import React, {useEffect, useRef} from 'react';
import {View, StyleSheet, Animated, Easing} from 'react-native';
import {getResponsiveHeight, getResponsiveWidth} from 'utils/responsive';
import {CalloutBubble} from 'components/modal/GuideModal';

export default function ChatGuideVisual({variant = 'chat_action', step}) {
  const tap = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    tap.setValue(0);
    pulse.setValue(0);
    const tapLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(tap, {
          toValue: 1,
          duration: 850,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(550),
        Animated.timing(tap, {toValue: 0, duration: 1, useNativeDriver: true}),
      ]),
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 650,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 650,
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

  const tapScale = tap.interpolate({inputRange: [0, 1], outputRange: [0.7, 2.2]});
  const tapOpacity = tap.interpolate({inputRange: [0, 1], outputRange: [0.28, 0]});
  const pulseScale = pulse.interpolate({inputRange: [0, 1], outputRange: [1, 1.5]});
  const pulseOpacity = pulse.interpolate({inputRange: [0, 1], outputRange: [0.55, 0]});

  return (
    <View style={styles.wrap}>
      <View style={styles.scene}>
        <View style={styles.fakeHeader}>
          <View style={styles.headerPill} />
          <View style={styles.iconPills}>
            <View style={styles.iconPill} />
            <View style={styles.iconPill} />
          </View>
        </View>
        <View style={styles.roomList}>
          <View style={styles.roomItem} />
          <View style={styles.roomItem} />
          <View style={styles.roomItem} />
        </View>
        <View style={styles.fabWrap}>
          <Animated.View
            style={[
              styles.fabPulse,
              {transform: [{scale: pulseScale}], opacity: pulseOpacity},
            ]}
          />
          <View style={[styles.tapAnchor, styles.fabTapAnchor]} pointerEvents="none">
            <Animated.View
              style={[
                styles.tapRipple,
                {transform: [{scale: tapScale}], opacity: tapOpacity},
              ]}
            />
            <View style={styles.tapCenter} />
          </View>
          <View style={styles.fab}>
            <View style={styles.fabPlusH} />
            <View style={styles.fabPlusV} />
          </View>
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveHeight(16),
  },
  headerPill: {
    width: '40%',
    height: getResponsiveHeight(14),
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
  },
  iconPills: {
    flexDirection: 'row',
    gap: getResponsiveWidth(12),
  },
  iconPill: {
    width: getResponsiveWidth(24),
    height: getResponsiveWidth(24),
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  roomList: {
    gap: getResponsiveHeight(10),
  },
  roomItem: {
    height: getResponsiveHeight(64),
    borderRadius: getResponsiveWidth(14),
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  fabWrap: {
    position: 'absolute',
    right: getResponsiveWidth(20),
    bottom: getResponsiveHeight(20),
    width: getResponsiveWidth(56),
    height: getResponsiveWidth(56),
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabPulse: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    backgroundColor: '#111827',
  },
  fab: {
    width: getResponsiveWidth(56),
    height: getResponsiveWidth(56),
    borderRadius: 999,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabPlusH: {
    position: 'absolute',
    width: getResponsiveWidth(20),
    height: 2,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  fabPlusV: {
    position: 'absolute',
    width: 2,
    height: getResponsiveWidth(20),
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  fabTapAnchor: {
    position: 'absolute',
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tapRipple: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  tapCenter: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(17,24,39,0.2)',
  },
  calloutWrap: {
    marginTop: getResponsiveHeight(20),
    alignSelf: 'stretch',
  },
});
