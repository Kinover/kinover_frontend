// src/features/schedule/components/ScheduleGuideVisual.jsx
import React, {useEffect, useMemo, useRef} from 'react';
import {View, StyleSheet, Animated, Easing} from 'react-native';
import {getResponsiveHeight, getResponsiveWidth} from 'utils/responsive';

/**
 * ✅ ScheduleGuideVisual (로티 없이 Animated)
 * variant:
 * - add  : 플로팅 + 버튼 펄스 + 탭 힌트
 * - type : 3개 타입 칩(가족/개인/기념일) 강조(스캔/하이라이트)
 * - edit : 카드 살짝 떠오름 + 탭 리플(카드 선택)
 */
export default function ScheduleGuideVisual({variant = 'add'}) {
  const pulse = useRef(new Animated.Value(0)).current; // fab pulse / highlight pulse
  const tap = useRef(new Animated.Value(0)).current;   // tap ripple
  const float = useRef(new Animated.Value(0)).current; // card float / scan

  const cfg = useMemo(() => {
    switch (variant) {
      case 'type':
        return {
          showFab: false,
          showTap: false,
          showCard: true,
          showChips: true,
          tapAnchor: null,
          emphasis: 1,
        };
      case 'edit':
        return {
          showFab: false,
          showTap: true,
          showCard: true,
          showChips: false,
          tapAnchor: 'card',
          emphasis: 1,
        };
      case 'add':
      default:
        return {
          showFab: true,
          showTap: true,
          showCard: true,
          showChips: false,
          tapAnchor: 'fab',
          emphasis: 0,
        };
    }
  }, [variant]);

  useEffect(() => {
    pulse.stopAnimation();
    tap.stopAnimation();
    float.stopAnimation();

    pulse.setValue(0);
    tap.setValue(0);
    float.setValue(0);

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

    const tapLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(tap, {
          toValue: 1,
          duration: 850,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(550),
        Animated.timing(tap, {
          toValue: 0,
          duration: 1,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    );

    const floatUp = cfg.emphasis ? 360 : 420;
    const floatDown = cfg.emphasis ? 420 : 520;

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: floatUp,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: floatDown,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(cfg.emphasis ? 140 : 250),
      ]),
    );

    pulseLoop.start();
    if (cfg.showTap) tapLoop.start();
    floatLoop.start();

    return () => {
      pulseLoop.stop();
      tapLoop.stop();
      floatLoop.stop();
    };
  }, [cfg, pulse, tap, float]);

  // pulse
  const pulseScale = pulse.interpolate({inputRange: [0, 1], outputRange: [1, 1.55]});
  const pulseOpacity = pulse.interpolate({inputRange: [0, 1], outputRange: [0.55, 0]});

  // tap ripple
  const tapScale = tap.interpolate({inputRange: [0, 1], outputRange: [0.7, 2.2]});
  const tapOpacity = tap.interpolate({inputRange: [0, 1], outputRange: [0.28, 0]});

  // float (card / scan)
  const translateY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [cfg.emphasis ? 8 : 6, 0],
  });
  const scale = float.interpolate({
    inputRange: [0, 1],
    outputRange: [cfg.emphasis ? 0.975 : 0.985, 1],
  });

  // tap anchor
  const tapAnchorStyle = useMemo(() => {
    if (cfg.tapAnchor === 'fab') {
      return {
        right: getResponsiveWidth(18),
        bottom: getResponsiveHeight(18),
        left: undefined,
        top: undefined,
      };
    }
    if (cfg.tapAnchor === 'card') {
      return {
        left: getResponsiveWidth(18),
        bottom: getResponsiveHeight(66),
        right: undefined,
        top: undefined,
      };
    }
    return {};
  }, [cfg.tapAnchor]);

  return (
    <View style={styles.wrap}>
      {/* 상단: 타입 칩(variant=type) */}
      {cfg.showChips ? (
        <View style={styles.chipsRow}>
          {['가족', '개인', '기념일'].map((t, i) => (
            <Animated.View
              key={t}
              style={[
                styles.chip,
                i === 1 ? styles.chipMid : null,
                {
                  transform: [
                    {
                      scale:
                        i === 1
                          ? float.interpolate({inputRange: [0, 1], outputRange: [0.98, 1.04]})
                          : 1,
                    },
                  ],
                },
              ]}
            >
              <View style={styles.chipDot} />
              <View style={styles.chipLine} />
            </Animated.View>
          ))}
        </View>
      ) : (
        <View style={styles.topFakeHeader}>
          <View style={styles.headerPill} />
          <View style={styles.headerPillSmall} />
        </View>
      )}

      {/* 중단: 달력/리스트 느낌 영역 */}
      <View style={styles.calendarBox}>
        <View style={styles.calendarHeader}>
          <View style={styles.monthPill} />
          <View style={styles.iconPill} />
        </View>

        <View style={styles.grid}>
          {Array.from({length: 14}).map((_, i) => (
            <View key={i} style={[styles.day, i === 5 ? styles.dayActive : null]} />
          ))}
        </View>

        {/* type에서만: 스캔 하이라이트 바 */}
        {variant === 'type' ? (
          <Animated.View
            style={[
              styles.scanBar,
              {
                opacity: float.interpolate({inputRange: [0, 1], outputRange: [0.0, 0.35]}),
                transform: [
                  {
                    translateY: float.interpolate({inputRange: [0, 1], outputRange: [0, 34]}),
                  },
                ],
              },
            ]}
          />
        ) : null}
      </View>

      {/* 하단: 일정 카드(variant=edit에서 더 강조) */}
      <Animated.View style={[styles.card, {transform: [{translateY}, {scale}]}]}>
        <View style={styles.cardRow}>
          <View style={styles.cardTag} />
          <View style={styles.cardLines}>
            <View style={[styles.line, {width: '58%'}]} />
            <View style={[styles.line, {width: '78%', marginTop: 8}]} />
          </View>
        </View>
        <View style={styles.cardHint} />
      </Animated.View>

      {/* add에서만: + FAB */}
      {cfg.showFab ? (
        <View style={styles.fabWrap}>
          <View style={styles.fab}>
            <View style={styles.fabPlusH} />
            <View style={styles.fabPlusV} />
            <Animated.View
              style={[
                styles.fabPulse,
                {transform: [{scale: pulseScale}], opacity: pulseOpacity},
              ]}
            />
          </View>
        </View>
      ) : null}

      {/* tap ripple (add/edit) */}
      {cfg.showTap ? (
        <View style={[styles.tapAnchor, tapAnchorStyle]} pointerEvents="none">
          <Animated.View
            style={[
              styles.ripple,
              {transform: [{scale: tapScale}], opacity: tapOpacity},
            ]}
          />
          <View style={styles.tapCenter} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    height: '100%',
    padding: getResponsiveWidth(14),
    justifyContent: 'space-between',
  },

  // fake header (type가 아니면)
  topFakeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerPill: {
    width: '54%',
    height: 14,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
  },
  headerPillSmall: {
    width: '20%',
    height: 14,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
  },

  // chips (type)
  chipsRow: {
    flexDirection: 'row',
    gap: getResponsiveWidth(10),
    justifyContent: 'space-between',
  },
  chip: {
    flex: 1,
    height: getResponsiveHeight(34),
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsiveWidth(10),
    gap: 8,
  },
  chipMid: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(17,24,39,0.12)',
  },
  chipDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#D1D5DB',
  },
  chipLine: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
  },

  // calendar box
  calendarBox: {
    width: '100%',
    borderRadius: getResponsiveWidth(16),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.08)',
    padding: getResponsiveWidth(12),
    overflow: 'hidden',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveHeight(10),
  },
  monthPill: {
    width: '38%',
    height: 12,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
  },
  iconPill: {
    width: 22,
    height: 22,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getResponsiveWidth(8),
  },
  day: {
    width: getResponsiveWidth(26),
    height: getResponsiveWidth(18),
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  dayActive: {
    backgroundColor: '#E5E7EB',
  },
  scanBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: getResponsiveHeight(28),
    backgroundColor: '#111827',
    top: getResponsiveHeight(46),
  },

  // card
  card: {
    height: getResponsiveHeight(86),
    borderRadius: getResponsiveWidth(16),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.06)',
    padding: getResponsiveWidth(12),
    justifyContent: 'space-between',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(10),
  },
  cardTag: {
    width: 10,
    height: '70%',
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
  },
  cardLines: {flex: 1},
  line: {
    height: 10,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  cardHint: {
    height: 12,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },

  // FAB
  fabWrap: {
    position: 'absolute',
    right: getResponsiveWidth(18),
    bottom: getResponsiveHeight(18),
  },
  fab: {
    width: getResponsiveWidth(44),
    height: getResponsiveWidth(44),
    borderRadius: 999,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  fabPlusH: {
    position: 'absolute',
    width: getResponsiveWidth(16),
    height: 2,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  fabPlusV: {
    position: 'absolute',
    width: 2,
    height: getResponsiveWidth(16),
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  fabPulse: {
    position: 'absolute',
    width: getResponsiveWidth(44),
    height: getResponsiveWidth(44),
    borderRadius: 999,
    backgroundColor: '#111827',
  },

  // tap ripple
  tapAnchor: {
    position: 'absolute',
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ripple: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: '#111827',
  },
  tapCenter: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#111827',
  },
});
