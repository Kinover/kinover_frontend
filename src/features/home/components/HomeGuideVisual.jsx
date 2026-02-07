// src/features/home/components/HomeGuideVisual.jsx
import React, {useEffect, useMemo, useRef} from 'react';
import {View, StyleSheet, Animated, Easing} from 'react-native';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveIconSize,
} from 'utils/responsive';

/**
 * ✅ HomeGuideVisual (너희 홈 UX 4가지 핵심 액션을 “보이게”)
 *
 * step1: (가족 탭) → 아래에서 위로 감정이 튀어나옴 + 접속 상태(초록 점) 힌트
 * step2: (가족 꾹) → 프로필 편집(UserBottomSheet) 힌트
 * step3: (내 프로필 꾹) → 감정 상태 변경(StateScreen) 힌트
 * step4: (가족 아이콘 탭) → 초대 코드 복사(FamilyCodeModal) 힌트
 *
 * - 실제 HeaderSection / MemberGridSection “느낌”을 닮게:
 *   큰 원형(내 프로필) + 아래 가족 원형들 + 우측 상단에 가족 아이콘(초대) 더미
 *
 * 사용:
 * <HomeGuideVisual variant="step1" />
 *  (기존 호환) status -> step1, edit -> step2, invite -> step4
 */
export default function HomeGuideVisual({variant = 'step1'}) {
  // ---------------------------------------------------------
  // ✅ tokens (Kinover 톤)
  // ---------------------------------------------------------
  const KINO_YELLOW = '#FFC84D';
  const BG_LIGHT = '#F9F9F9';
  const INK = '#111827';
  const MUTED = '#E5E7EB';
  const SOFT = '#F3F4F6';
  const ONLINE = '#22C55E';
  const BORDER = 'rgba(17,24,39,0.08)';

  // ---------------------------------------------------------
  // ✅ sizes (너희 HeaderSection 감성: 큰 원형 + 링)
  // ---------------------------------------------------------
  const PADDING = getResponsiveWidth(18);

  const BIG_RING = getResponsiveIconSize(140);
  const BIG_PROFILE = getResponsiveIconSize(124);

  const SMALL = getResponsiveIconSize(64);

  const DOT_WRAP = getResponsiveIconSize(18);
  const DOT = getResponsiveIconSize(10);
  const DOT_PULSE = getResponsiveIconSize(16);

  const FAMILY_ICON = getResponsiveIconSize(42); // “가족 초대” 아이콘 더미
  const FAMILY_ICON_PULSE = FAMILY_ICON;

  const CARD_H = getResponsiveHeight(82); // “편집” 가이드용 더미 카드

  // ---------------------------------------------------------
  // ✅ animations
  // ---------------------------------------------------------
  const pulse = useRef(new Animated.Value(0)).current; // dot/icon pulse
  const tap = useRef(new Animated.Value(0)).current; // tap ripple
  const hold = useRef(new Animated.Value(0)).current; // long-press hint
  const emo = useRef(new Animated.Value(0)).current; // emotion pop hint
  const card = useRef(new Animated.Value(0)).current; // card emphasis

  // ---------------------------------------------------------
  // ✅ variant normalize (기존 status/edit/invite 호환)
  // ---------------------------------------------------------
  const resolved = useMemo(() => {
    if (variant === 'status') return 'step1';
    if (variant === 'edit') return 'step2';
    if (variant === 'invite') return 'step4';
    return variant; // step1~4
  }, [variant]);

  // ---------------------------------------------------------
  // ✅ config by step
  // ---------------------------------------------------------
  const cfg = useMemo(() => {
    switch (resolved) {
      case 'step2':
        return {
          // 가족 꾹 → 편집
          showOnlineDot: true,
          showEmotionPop: false,
          showTap: true,
          tapTarget: 'member1',
          tapColor: INK,
          showHold: true,
          holdTarget: 'member1',
          showFamilyIconPulse: false,
          showCard: true,
          cardEmphasis: 1,
        };
      case 'step3':
        return {
          // 내 프로필 꾹 → 감정 변경
          showOnlineDot: false,
          showEmotionPop: false,
          showTap: true,
          tapTarget: 'me',
          tapColor: INK,
          showHold: true,
          holdTarget: 'me',
          showFamilyIconPulse: false,
          showCard: false,
          cardEmphasis: 0,
        };
      case 'step4':
        return {
          // 가족 아이콘 탭 → 초대 코드 복사
          showOnlineDot: false,
          showEmotionPop: false,
          showTap: true,
          tapTarget: 'familyIcon',
          tapColor: INK,
          showHold: false,
          holdTarget: null,
          showFamilyIconPulse: true,
          showCard: false,
          cardEmphasis: 0,
        };
      case 'step1':
      default:
        return {
          // 가족 탭 → 감정 뿅 + 접속 점
          showOnlineDot: true,
          showEmotionPop: true,
          showTap: true,
          tapTarget: 'member1',
          tapColor: INK,
          showHold: false,
          holdTarget: null,
          showFamilyIconPulse: false,
          showCard: false,
          cardEmphasis: 0,
        };
    }
  }, [resolved, INK]);

  // ---------------------------------------------------------
  // ✅ run loops
  // ---------------------------------------------------------
  useEffect(() => {
    pulse.stopAnimation();
    tap.stopAnimation();
    hold.stopAnimation();
    emo.stopAnimation();
    card.stopAnimation();

    pulse.setValue(0);
    tap.setValue(0);
    hold.setValue(0);
    emo.setValue(0);
    card.setValue(0);

    // pulse: online dot or family icon
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

    // tap ripple
    const tapLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(tap, {
          toValue: 1,
          duration: 850,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(520),
        Animated.timing(tap, {
          toValue: 0,
          duration: 1,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    );

    // long press hint (hold ring)
    const holdLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(hold, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(hold, {
          toValue: 0,
          duration: 520,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(260),
      ]),
    );

    // emotion pop hint (아래에서 위로 “뿅”)
    const emoLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(900),
        Animated.timing(emo, {
          toValue: 1,
          duration: 160,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(emo, {
          toValue: 0,
          duration: 260,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(980),
      ]),
    );

    // card emphasis (step2)
    const upDur = cfg.cardEmphasis ? 340 : 420;
    const downDur = cfg.cardEmphasis ? 420 : 520;

    const cardLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(card, {
          toValue: 1,
          duration: upDur,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(card, {
          toValue: 0,
          duration: downDur,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(cfg.cardEmphasis ? 120 : 240),
      ]),
    );

    // start
    if (cfg.showOnlineDot || cfg.showFamilyIconPulse) pulseLoop.start();
    if (cfg.showTap) tapLoop.start();
    if (cfg.showHold) holdLoop.start();
    if (cfg.showEmotionPop) emoLoop.start();
    if (cfg.showCard) cardLoop.start();

    return () => {
      pulseLoop.stop();
      tapLoop.stop();
      holdLoop.stop();
      emoLoop.stop();
      cardLoop.stop();
    };
  }, [cfg, pulse, tap, hold, emo, card]);

  // ---------------------------------------------------------
  // ✅ interpolations
  // ---------------------------------------------------------
  const pulseScale = pulse.interpolate({inputRange: [0, 1], outputRange: [1, 1.7]});
  const pulseOpacity = pulse.interpolate({inputRange: [0, 1], outputRange: [0.55, 0]});

  const tapScale = tap.interpolate({inputRange: [0, 1], outputRange: [0.7, 2.2]});
  const tapOpacity = tap.interpolate({inputRange: [0, 1], outputRange: [0.22, 0]});

  const holdScale = hold.interpolate({inputRange: [0, 1], outputRange: [1.0, 1.12]});
  const holdOpacity = hold.interpolate({inputRange: [0, 1], outputRange: [0.18, 0.06]});

  const emoTranslateY = emo.interpolate({inputRange: [0, 1], outputRange: [18, 0]});
  const emoOpacity = emo.interpolate({inputRange: [0, 1], outputRange: [0, 1]});
  const emoScale = emo.interpolate({inputRange: [0, 1], outputRange: [0.92, 1]});

  const cardTranslateY = card.interpolate({inputRange: [0, 1], outputRange: [10, 0]});
  const cardScale = card.interpolate({inputRange: [0, 1], outputRange: [0.97, 1]});

  // ---------------------------------------------------------
  // ✅ anchor positions (step별 target)
  // ---------------------------------------------------------
  const anchors = useMemo(() => {
    // 화면 구조:
    // - 우상단: 가족 아이콘
    // - 중앙 상단: 내 프로필 큰 원
    // - 하단: 가족 원형 3개 (member1 = 왼쪽)
    const topY = PADDING + getResponsiveHeight(20);

    return {
      familyIcon: {
        right: PADDING,
        top: topY,
      },
      me: {
        left: '50%',
        top: topY + getResponsiveHeight(72),
        // 실제로는 transform으로 중앙 맞출거라 left만 50%로 둠
      },
      member1: {
        left: PADDING + SMALL / 2 - 6,
        top: topY + getResponsiveHeight(260),
      },
    };
  }, [PADDING, SMALL]);

  const tapAnchorStyle = useMemo(() => {
    const t = cfg.tapTarget;
    if (t === 'familyIcon') {
      return {position: 'absolute', ...anchors.familyIcon};
    }
    if (t === 'me') {
      return {
        position: 'absolute',
        left: '50%',
        top: anchors.me.top,
        transform: [{translateX: -6}],
      };
    }
    // member1
    return {position: 'absolute', ...anchors.member1};
  }, [cfg.tapTarget, anchors]);

  const holdAnchorStyle = useMemo(() => {
    const t = cfg.holdTarget;
    if (t === 'me') {
      return {
        position: 'absolute',
        left: '50%',
        top: anchors.me.top + BIG_RING / 2 - BIG_PROFILE / 2 - 6,
        transform: [{translateX: -BIG_PROFILE / 2}],
      };
    }
    if (t === 'member1') {
      return {
        position: 'absolute',
        left: PADDING,
        top: anchors.member1.top - (SMALL / 2 - 6),
      };
    }
    return null;
  }, [cfg.holdTarget, anchors, BIG_RING, BIG_PROFILE, PADDING, SMALL]);

  // ---------------------------------------------------------
  // ✅ emotion pop 위치: “가족 탭하면 아래에서 위로 튀어오름”을 보여주려면
  // - member1 원형 내부 하단에서 시작해서 위로 올라오게
  // ---------------------------------------------------------
  const emoAnchorStyle = useMemo(() => {
    return {
      position: 'absolute',
      left: PADDING,
      top: anchors.member1.top - (SMALL / 2 - 6),
      width: SMALL,
      height: SMALL,
      borderRadius: 999,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'flex-end',
    };
  }, [PADDING, anchors, SMALL]);

  // ---------------------------------------------------------
  // ✅ render
  // ---------------------------------------------------------
  return (
    <View style={[styles.wrap, {padding: PADDING, backgroundColor: BG_LIGHT}]}>
      {/* ✅ (4) 가족 아이콘: 눌러서 초대 코드 복사 */}
      <View style={[styles.familyIconWrap, {right: PADDING, top: PADDING}]}>
        <View
          style={[
            styles.familyIcon,
            {width: FAMILY_ICON, height: FAMILY_ICON, borderRadius: 999, backgroundColor: KINO_YELLOW},
          ]}
        />
        {cfg.showFamilyIconPulse ? (
          <Animated.View
            style={[
              styles.familyIconPulse,
              {
                width: FAMILY_ICON_PULSE,
                height: FAMILY_ICON_PULSE,
                borderRadius: 999,
                backgroundColor: KINO_YELLOW,
                transform: [{scale: pulseScale}],
                opacity: pulseOpacity,
              },
            ]}
          />
        ) : null}
      </View>

      {/* ✅ (3) 내 프로필: 꾹 눌러 감정 상태 변경 */}
      <View style={styles.meWrap}>
        <View
          style={[
            styles.bigRing,
            {width: BIG_RING, height: BIG_RING, borderRadius: BIG_RING / 2, borderColor: BORDER},
          ]}>
          <View
            style={[
              styles.bigProfile,
              {width: BIG_PROFILE, height: BIG_PROFILE, borderRadius: BIG_PROFILE / 2, backgroundColor: MUTED},
            ]}
          />
          {/* 내 감정 힌트(가짜): 링 안쪽에 살짝 오버레이 */}
          <View style={[styles.meEmotionChip, {backgroundColor: 'rgba(255,200,77,0.18)'}]} />
        </View>
      </View>

      {/* ✅ (2) 가족 프로필 3개: 탭/롱프레스 액션이 있는 영역 */}
      <View style={styles.memberRow}>
        {[0, 1, 2].map(i => (
          <View key={i} style={[styles.member, {width: SMALL, height: SMALL, borderRadius: SMALL / 2}]}>
            <View style={[styles.memberInner, {backgroundColor: MUTED}]} />

            {/* (1) 접속 상태: 초록 점 + 펄스 (첫 번째 멤버에만) */}
            {cfg.showOnlineDot && i === 0 ? (
              <View style={[styles.dotWrap, {width: DOT_WRAP, height: DOT_WRAP}]}>
                <View style={[styles.dotBorder, {width: DOT + 4, height: DOT + 4}]} />
                <View style={[styles.dot, {width: DOT, height: DOT, backgroundColor: ONLINE}]} />
                <Animated.View
                  style={[
                    styles.dotPulse,
                    {
                      width: DOT_PULSE,
                      height: DOT_PULSE,
                      backgroundColor: ONLINE,
                      transform: [{scale: pulseScale}],
                      opacity: pulseOpacity,
                    },
                  ]}
                />
              </View>
            ) : null}

            {/* (1) 감정 뿅 힌트: “탭하면 아래에서 위로 튀어나오는” 연출 */}
            {cfg.showEmotionPop && i === 0 ? (
              <View style={emoAnchorStyle} pointerEvents="none">
                <Animated.View
                  style={[
                    styles.emotionBubble,
                    {
                      transform: [{translateY: emoTranslateY}, {scale: emoScale}],
                      opacity: emoOpacity,
                    },
                  ]}>
                  <View style={styles.emotionDot} />
                </Animated.View>
              </View>
            ) : null}
          </View>
        ))}
      </View>

      {/* ✅ (2) 가족 꾹 → 편집 힌트용 카드(가짜) */}
      {cfg.showCard ? (
        <Animated.View
          style={[
            styles.card,
            {
              height: CARD_H,
              transform: [{translateY: cardTranslateY}, {scale: cardScale}],
            },
          ]}>
          <View style={[styles.cardAccent, {backgroundColor: KINO_YELLOW}]} />
          <View style={styles.cardRow}>
            <View style={[styles.cardAvatar, {backgroundColor: MUTED}]} />
            <View style={styles.cardLines}>
              <View style={[styles.line, {width: '58%', backgroundColor: SOFT}]} />
              <View style={[styles.line, {width: '78%', marginTop: 8, backgroundColor: SOFT}]} />
            </View>
          </View>
          <View style={[styles.cardHint, {backgroundColor: '#F9FAFB'}]} />
        </Animated.View>
      ) : null}

      {/* ✅ Tap ripple (step1/2/3/4) */}
      {cfg.showTap ? (
        <View style={[styles.tapAnchor, tapAnchorStyle]} pointerEvents="none">
          <Animated.View
            style={[
              styles.ripple,
              {
                backgroundColor: cfg.tapColor,
                transform: [{scale: tapScale}],
                opacity: tapOpacity,
              },
            ]}
          />
          <View style={[styles.tapCenter, {backgroundColor: cfg.tapColor}]} />
        </View>
      ) : null}

      {/* ✅ Long press ring hint (step2/3) */}
      {cfg.showHold && holdAnchorStyle ? (
        <View style={[styles.holdAnchor, holdAnchorStyle]} pointerEvents="none">
          <Animated.View
            style={[
              styles.holdRing,
              {
                transform: [{scale: holdScale}],
                opacity: holdOpacity,
                borderColor: KINO_YELLOW,
              },
            ]}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-start',
    overflow: 'visible',
  },

  // family icon (초대)
  familyIconWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  familyIcon: {
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.08)',
  },
  familyIconPulse: {
    position: 'absolute',
  },

  // me profile
  meWrap: {
    marginTop: getResponsiveHeight(44),
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigRing: {
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  bigProfile: {},
  meEmotionChip: {
    position: 'absolute',
    width: getResponsiveIconSize(56),
    height: getResponsiveIconSize(56),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.08)',
  },

  // member row
  memberRow: {
    marginTop: getResponsiveHeight(40),
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveWidth(8),
  },
  member: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  memberInner: {
    width: '86%',
    height: '86%',
    borderRadius: 999,
  },

  // online dot
  dotWrap: {
    position: 'absolute',
    right: -2,
    top: -2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  dotBorder: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  dot: {
    borderRadius: 999,
  },
  dotPulse: {
    position: 'absolute',
    borderRadius: 999,
  },

  // emotion pop bubble
  emotionBubble: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emotionDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: '#FF3B30',
  },

  // card (edit guide)
  card: {
    marginTop: getResponsiveHeight(22),
    borderRadius: getResponsiveWidth(16),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.06)',
    padding: getResponsiveWidth(12),
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 6,
    height: '100%',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(10),
  },
  cardAvatar: {
    width: getResponsiveWidth(38),
    height: getResponsiveWidth(38),
    borderRadius: getResponsiveWidth(12),
  },
  cardLines: {flex: 1},
  line: {
    height: 10,
    borderRadius: 6,
  },
  cardHint: {
    height: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.06)',
  },

  // tap ripple
  tapAnchor: {
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
  },
  ripple: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 999,
  },
  tapCenter: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },

  // long press ring hint
  holdAnchor: {
    zIndex: 25,
  },
  holdRing: {
    width: getResponsiveIconSize(72),
    height: getResponsiveIconSize(72),
    borderRadius: 999,
    borderWidth: 3,
    backgroundColor: 'rgba(255,200,77,0.08)',
  },
});
