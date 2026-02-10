/* eslint-disable react-native/no-inline-styles */
// src/features/home/components/HomeGuideVisual.jsx
//
// ✅ HomeGuideModal steps(variant) 전용 비주얼
// - family_status: 접속중(초록 dot + pill) + 감정 캐릭터 peek
// - family_edit  : 길게 누름(롱프레스 링) + UserBottomSheet 올라오는 장면
// - my_mood      : 상단 smile 버튼 강조 + 감정 선택(StateScreen 느낌) 패널 팝
// - family_invite: "가족 추가하기" 버튼 누름 + FamilyCodeModal(초대코드) 팝 + 복사 피드백
//
// ✅ Reanimated Worklet 안전 규칙
// - useAnimatedStyle 안에서 getResponsiveHeight/Width/IconSize/FontSize 호출 ❌
// - 필요한 수치는 전부 useMemo로 미리 계산 ✅

import React, {useEffect, useMemo} from 'react';
import {View, StyleSheet, Platform} from 'react-native';

import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveIconSize,
  getResponsiveFontSize,
} from '../../../utils/responsive';

export default function HomeGuideVisual({
  variant = 'family_status',
  scale = 0.78,
}) {
  /**
   * =========================================================
   * ✅ 1) 모든 수치(숫자) 계산: worklet 밖에서만
   * =========================================================
   */
  const m = useMemo(() => {
    // 캔버스(가이드 모달 안에서 보여줄 “미니 홈 화면”)
    const W = Math.round(getResponsiveWidth(332));
    const H = Math.round(getResponsiveHeight(220));
    const R = Math.round(getResponsiveIconSize(16));
    const PAD = Math.round(getResponsiveWidth(14));

    // 홈 배경/커브 느낌(대충)
    const TOP_YELLOW_H = Math.round(getResponsiveHeight(60));

    // HeaderSection 느낌
    const HEADER_H = Math.round(getResponsiveHeight(90));
    const AVATAR = Math.round(getResponsiveIconSize(58));
    const RING = Math.round(AVATAR * 1.22);
    const RING_BW = 5;

    const CARD_H = Math.round(getResponsiveHeight(74));
    const ICON_BTN = Math.round(getResponsiveIconSize(30));
    const ICON_R = Math.round(getResponsiveIconSize(10));

    // MemberGridSection 느낌
    const GRID_TOP = Math.round(getResponsiveHeight(10));
    const GRID_GAP_X = Math.round(getResponsiveWidth(8));
    const GRID_GAP_Y = Math.round(getResponsiveHeight(12));

    const GRID_ITEM = Math.round(getResponsiveIconSize(60));
    const GRID_R = Math.round(GRID_ITEM * 0.28);

    const DOT = Math.max(8, Math.min(14, Math.round(GRID_ITEM * 0.22)));
    const DOT_BORDER = 2;

    const PILL_H = Math.round(getResponsiveHeight(18));
    const PILL_W = Math.round(getResponsiveWidth(58));

    // 하단 “가족 추가하기”
    const ADD_BTN_H = Math.round(getResponsiveHeight(44));
    const ADD_BTN_R = Math.round(getResponsiveIconSize(12));

    // BottomSheet(UserBottomSheet) 미니
    const SHEET_W = Math.round(W * 0.92);
    const SHEET_H = Math.round(getResponsiveHeight(150));
    const SHEET_R = R;
    const SHEET_TY_START = Math.round(getResponsiveHeight(170));

    // FamilyCodeModal 미니
    const MODAL_W = Math.round(W * 0.86);
    const MODAL_H = Math.round(getResponsiveHeight(130));

    // 감정 peek (HeaderSection/MemberGrid 참고)
    const EMO_SIZE = Math.round(AVATAR * 1.06);
    const EMO_HIDE_Y = Math.round(AVATAR * 1.25);
    const EMO_RISE = Math.round(AVATAR * 1.05);
    const EMO_TILT_DEG = 12;
    const EMO_PIVOT = Math.round(AVATAR * 0.18);

    // my_mood: 감정 선택 패널(StateScreen 느낌)
    const MOOD_PANEL_W = Math.round(W * 0.88);
    const MOOD_PANEL_H = Math.round(getResponsiveHeight(150));
    const MOOD_ITEM = Math.round(getResponsiveIconSize(40));
    const MOOD_GAP = Math.round(getResponsiveWidth(10));
    const MOOD_R = Math.round(getResponsiveIconSize(14));

    return {
      W,
      H,
      R,
      PAD,
      TOP_YELLOW_H,

      HEADER_H,
      AVATAR,
      RING,
      RING_BW,
      CARD_H,
      ICON_BTN,
      ICON_R,

      GRID_TOP,
      GRID_GAP_X,
      GRID_GAP_Y,
      GRID_ITEM,
      GRID_R,
      DOT,
      DOT_BORDER,
      PILL_W,
      PILL_H,

      ADD_BTN_H,
      ADD_BTN_R,

      SHEET_W,
      SHEET_H,
      SHEET_R,
      SHEET_TY_START,

      MODAL_W,
      MODAL_H,

      EMO_SIZE,
      EMO_HIDE_Y,
      EMO_RISE,
      EMO_TILT_DEG,
      EMO_PIVOT,

      MOOD_PANEL_W,
      MOOD_PANEL_H,
      MOOD_ITEM,
      MOOD_GAP,
      MOOD_R,
    };
  }, []);

  /**
   * =========================================================
   * ✅ 2) 애니메이션 값
   * =========================================================
   */
  const pulse = useSharedValue(0); // 클릭/롱프레스 링
  const dotPulse = useSharedValue(0); // 온라인 dot
  const pillShow = useSharedValue(0); // 접속중 pill
  const emoPop = useSharedValue(0); // 감정 peek
  const emoTilt = useSharedValue(0);
  const emoPivot = useSharedValue(0);

  const sheetUp = useSharedValue(0); // 바텀시트
  const btnPress = useSharedValue(0); // 가족 추가 버튼 press
  const modalPop = useSharedValue(0); // 초대코드 모달
  const copied = useSharedValue(0); // 복사 상태 느낌
  const moodPop = useSharedValue(0); // 감정 선택 패널

  /**
   * =========================================================
   * ✅ 3) variant별 시퀀스
   * =========================================================
   */
  useEffect(() => {
    // cancel + reset
    [
      pulse,
      dotPulse,
      pillShow,
      emoPop,
      emoTilt,
      emoPivot,
      sheetUp,
      btnPress,
      modalPop,
      copied,
      moodPop,
    ].forEach(v => cancelAnimation(v));

    pulse.value = 0;
    dotPulse.value = 0;
    pillShow.value = 0;
    emoPop.value = 0;
    emoTilt.value = 0;
    emoPivot.value = 0;
    sheetUp.value = 0;
    btnPress.value = 0;
    modalPop.value = 0;
    copied.value = 0;
    moodPop.value = 0;

    // family_status: 온라인 + pill + emo peek 반복
    if (variant === 'family_status') {
      dotPulse.value = withRepeat(
        withSequence(
          withTiming(1, {duration: 140}),
          withTiming(0, {duration: 200}),
          withDelay(540, withTiming(0, {duration: 10})),
        ),
        -1,
        false,
      );

      pillShow.value = withRepeat(
        withSequence(
          withDelay(180, withTiming(1, {duration: 220})),
          withDelay(980, withTiming(0, {duration: 1})),
        ),
        -1,
        false,
      );

      // 프로필 탭 느낌(링) + 감정 튀어나오기
      pulse.value = withRepeat(
        withSequence(
          withDelay(240, withTiming(1, {duration: 140, easing: Easing.out(Easing.cubic)})),
          withTiming(0, {duration: 240, easing: Easing.out(Easing.cubic)}),
          withDelay(1100, withTiming(0, {duration: 10})),
        ),
        -1,
        false,
      );

      const runPeek = () => {
        // 방향만 살짝 랜덤 느낌(고정 값으로도 충분)
        const dir = Math.random() > 0.5 ? 1 : -1;
        emoPop.value = withTiming(1, {duration: 130, easing: Easing.out(Easing.cubic)});
        emoPivot.value = withTiming(dir, {duration: 120});
        emoTilt.value = withSequence(
          withTiming(dir, {duration: 120, easing: Easing.out(Easing.cubic)}),
          withTiming(-dir * 0.25, {duration: 140, easing: Easing.out(Easing.cubic)}),
          withTiming(0, {duration: 120, easing: Easing.out(Easing.cubic)}),
        );
        emoPop.value = withDelay(
          520,
          withSpring(0, {damping: 11, stiffness: 220, mass: 0.65}),
        );
        emoPivot.value = withDelay(520, withTiming(0, {duration: 180}));
      };

      // 1.6초~2.4초 템포로 반복
      emoPop.value = withRepeat(
        withSequence(
          withDelay(260, withTiming(0, {duration: 1})),
          withTiming(0, {duration: 1}), // 자리 확보
          withDelay(40, withTiming(0, {duration: 1})),
        ),
        -1,
        false,
      );
      // 실제 peek는 타이밍 기반으로 한 번씩 실행(간단히: repeat 안에서 직접 못 부르니까 여기서 별도 타이밍)
      const t = setInterval(() => runPeek(), 2000);
      return () => clearInterval(t);
    }

    // family_edit: 롱프레스 링 + 바텀시트 올라왔다가 리셋 반복
    if (variant === 'family_edit') {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, {duration: 260, easing: Easing.out(Easing.cubic)}),
          withTiming(0, {duration: 220, easing: Easing.out(Easing.cubic)}),
          withDelay(900, withTiming(0, {duration: 10})),
        ),
        -1,
        false,
      );

      sheetUp.value = withRepeat(
        withSequence(
          withDelay(220, withTiming(1, {duration: 380, easing: Easing.out(Easing.cubic)})),
          withDelay(980, withTiming(0, {duration: 1})),
        ),
        -1,
        false,
      );

      return;
    }

    // my_mood: smile 버튼 강조 + 감정 선택 패널 팝 반복
    if (variant === 'my_mood') {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, {duration: 150, easing: Easing.out(Easing.cubic)}),
          withTiming(0, {duration: 230, easing: Easing.out(Easing.cubic)}),
          withDelay(660, withTiming(0, {duration: 10})),
        ),
        -1,
        false,
      );

      moodPop.value = withRepeat(
        withSequence(
          withDelay(240, withTiming(1, {duration: 260, easing: Easing.out(Easing.cubic)})),
          withDelay(980, withTiming(0, {duration: 1})),
        ),
        -1,
        false,
      );

      return;
    }

    // family_invite: 버튼 누름 + 모달 팝 + 복사 피드백(복사됨)
    btnPress.value = withRepeat(
      withSequence(
        withDelay(140, withTiming(1, {duration: 120, easing: Easing.out(Easing.cubic)})),
        withTiming(0, {duration: 180, easing: Easing.out(Easing.cubic)}),
        withDelay(920, withTiming(0, {duration: 10})),
      ),
      -1,
      false,
    );

    modalPop.value = withRepeat(
      withSequence(
        withDelay(360, withTiming(1, {duration: 260, easing: Easing.out(Easing.cubic)})),
        withDelay(980, withTiming(0, {duration: 1})),
      ),
      -1,
      false,
    );

    copied.value = withRepeat(
      withSequence(
        withDelay(620, withTiming(1, {duration: 160, easing: Easing.out(Easing.cubic)})),
        withDelay(520, withTiming(0, {duration: 220, easing: Easing.out(Easing.cubic)})),
        withDelay(240, withTiming(0, {duration: 10})),
      ),
      -1,
      false,
    );
  }, [
    variant,
    pulse,
    dotPulse,
    pillShow,
    emoPop,
    emoTilt,
    emoPivot,
    sheetUp,
    btnPress,
    modalPop,
    copied,
    moodPop,
  ]);

  /**
   * =========================================================
   * ✅ 4) Animated styles (숫자만 사용)
   * =========================================================
   */
  const pulseRingStyle = useAnimatedStyle(() => {
    const s = 1 + pulse.value * 0.06;
    const o = interpolate(pulse.value, [0, 1], [0, 1]);
    return {opacity: o, transform: [{scale: s}]};
  });

  const onlineDotStyle = useAnimatedStyle(() => {
    const s = 1 + dotPulse.value * 0.22;
    const o = 0.72 + dotPulse.value * 0.28;
    return {opacity: o, transform: [{scale: s}]};
  });

  const pillStyle = useAnimatedStyle(() => {
    const o = pillShow.value;
    const ty = interpolate(pillShow.value, [0, 1], [6, 0]);
    return {opacity: o, transform: [{translateY: ty}]};
  });

  const emoStyle = useAnimatedStyle(() => {
    const px = emoPivot.value * m.EMO_PIVOT;
    const deg = `${emoTilt.value * m.EMO_TILT_DEG}deg`;
    const ty = m.EMO_HIDE_Y - emoPop.value * m.EMO_RISE;

    const sc = interpolate(emoPop.value, [0, 1], [0.98, 1.06]);
    const op = interpolate(emoPop.value, [0, 0.22, 1], [0, 1, 1]);

    return {
      opacity: op,
      transform: [
        {translateY: ty},
        {translateX: px},
        {rotate: deg},
        {translateX: -px},
        {scale: sc},
      ],
    };
  });

  const sheetStyle = useAnimatedStyle(() => {
    const ty = interpolate(sheetUp.value, [0, 1], [m.SHEET_TY_START, 0]);
    const o = interpolate(sheetUp.value, [0, 0.35, 1], [0, 1, 1]);
    return {opacity: o, transform: [{translateY: ty}]};
  });

  const addBtnPressStyle = useAnimatedStyle(() => {
    const s = 1 - btnPress.value * 0.03;
    return {transform: [{scale: s}]};
  });

  const modalStyle = useAnimatedStyle(() => {
    const o = interpolate(modalPop.value, [0, 0.35, 1], [0, 1, 1]);
    const ty = interpolate(modalPop.value, [0, 1], [18, 0]);
    const s = interpolate(modalPop.value, [0, 1], [0.985, 1]);
    return {opacity: o, transform: [{translateY: ty}, {scale: s}]};
  });

  const copiedStyle = useAnimatedStyle(() => {
    const on = copied.value;
    const o = interpolate(on, [0, 1], [0, 1]);
    const s = 1 + on * 0.02;
    return {opacity: o, transform: [{scale: s}]};
  });

  const moodPanelStyle = useAnimatedStyle(() => {
    const o = interpolate(moodPop.value, [0, 0.35, 1], [0, 1, 1]);
    const ty = interpolate(moodPop.value, [0, 1], [16, 0]);
    const s = interpolate(moodPop.value, [0, 1], [0.985, 1]);
    return {opacity: o, transform: [{translateY: ty}, {scale: s}]};
  });

  /**
   * =========================================================
   * ✅ 5) variant별로 “필요한 요소만” 노출
   * =========================================================
   */
  const showStatus = variant === 'family_status';
  const showEdit = variant === 'family_edit';
  const showMood = variant === 'my_mood';
  const showInvite = variant === 'family_invite';

  return (
    <View style={[styles.wrap, {transform: [{scale}]}]}>
      <View style={[styles.canvas, {width: m.W, height: m.H, borderRadius: m.R}]}>
        {/* 상단 노란 영역(홈 배경 느낌) */}
        <View style={[styles.topYellow, {height: m.TOP_YELLOW_H}]} />

        {/* ================= HeaderSection(미니) ================= */}
        <View style={[styles.headerRow, {height: m.HEADER_H, paddingHorizontal: m.PAD}]}>
          {/* 왼쪽 프로필 */}
          <View style={[styles.avatarArea, {width: m.RING, height: m.RING}]}>
            <View
              style={[
                styles.ring,
                {
                  width: m.RING,
                  height: m.RING,
                  borderRadius: m.RING / 2,
                  borderWidth: m.RING_BW,
                },
              ]}
            />
            <View
              style={[
                styles.avatar,
                {
                  width: m.AVATAR,
                  height: m.AVATAR,
                  borderRadius: m.AVATAR / 2,
                },
              ]}
            />

            {/* family_status: 감정 peek */}
            {showStatus && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.emo,
                  {
                    width: m.EMO_SIZE,
                    height: m.EMO_SIZE,
                    left: (m.RING - m.EMO_SIZE) / 2,
                    top: (m.RING - m.EMO_SIZE) / 2,
                  },
                  emoStyle,
                ]}
              />
            )}

            {/* family_status: 탭 링(프로필 쪽) */}
            {showStatus && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.pulseRing,
                  {
                    width: m.RING + 10,
                    height: m.RING + 10,
                    borderRadius: (m.RING + 10) / 2,
                  },
                  pulseRingStyle,
                ]}
              />
            )}
          </View>

          {/* 오른쪽 카드(이름/한줄소개) */}
          <View style={[styles.headerCard, {height: m.CARD_H, borderRadius: m.R}]}>
            {/* 우상단 버튼 2개: invite + smile */}
            <View style={[styles.topRightBtns, {right: m.PAD, top: m.PAD}]}>
              <View
                style={[
                  styles.iconBtn,
                  {
                    width: m.ICON_BTN,
                    height: m.ICON_BTN,
                    borderRadius: m.ICON_R,
                  },
                ]}
              />
              <View style={{width: m.PAD * 0.45}} />
              <View style={{position: 'relative'}}>
                <View
                  style={[
                    styles.iconBtn,
                    {
                      width: m.ICON_BTN,
                      height: m.ICON_BTN,
                      borderRadius: m.ICON_R,
                    },
                  ]}
                />
                {/* my_mood: smile 버튼 강조 링 */}
                {showMood && (
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.pulseRing,
                      {
                        width: m.ICON_BTN + 14,
                        height: m.ICON_BTN + 14,
                        borderRadius: (m.ICON_BTN + 14) / 2,
                      },
                      pulseRingStyle,
                    ]}
                  />
                )}
              </View>
            </View>

            <View style={styles.lineStrong} />
            <View style={styles.lineWeak} />
          </View>
        </View>

        {/* ================= MemberGridSection(미니) ================= */}
        <View style={[styles.gridArea, {paddingHorizontal: m.PAD, paddingTop: m.GRID_TOP}]}>
          {/* 2행 x 3열 */}
          <View style={[styles.gridRow, {columnGap: m.GRID_GAP_X}]}>
            {renderGridItem({m, highlight: showEdit, pulseRingStyle, isFirst: true})}
            {renderGridItem({m})}
            {renderGridItem({m})}
          </View>

          <View style={{height: m.GRID_GAP_Y}} />

          <View style={[styles.gridRow, {columnGap: m.GRID_GAP_X}]}>
            {renderGridItem({m})}
            {renderGridItem({m})}
            {renderGridItem({m})}
          </View>

          {/* family_status: 1번 아이템에 온라인 dot + pill */}
          {showStatus && (
            <>
              {/* dot */}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.dotBorder,
                  {
                    width: m.DOT + m.DOT_BORDER * 2,
                    height: m.DOT + m.DOT_BORDER * 2,
                    borderRadius: (m.DOT + m.DOT_BORDER * 2) / 2,
                    left: m.PAD + m.GRID_ITEM - (m.DOT + m.DOT_BORDER * 2) + 6,
                    top: m.GRID_TOP + 6,
                  },
                ]}
              />
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.dot,
                  {
                    width: m.DOT,
                    height: m.DOT,
                    borderRadius: m.DOT / 2,
                    left: m.PAD + m.GRID_ITEM - m.DOT + 6,
                    top: m.GRID_TOP + 6 + m.DOT_BORDER,
                  },
                  onlineDotStyle,
                ]}
              />
              {/* pill */}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.pill,
                  {
                    width: m.PILL_W,
                    height: m.PILL_H,
                    borderRadius: m.PILL_H / 2,
                    left: m.PAD + Math.round((m.GRID_ITEM - m.PILL_W) / 2),
                    top: m.GRID_TOP + m.GRID_ITEM + 6,
                  },
                  pillStyle,
                ]}
              />
            </>
          )}
        </View>

        {/* ================= Footer add button(미니) ================= */}
        <View style={[styles.footer, {paddingHorizontal: m.PAD}]}>
          <Animated.View
            style={[
              styles.addBtn,
              {
                height: m.ADD_BTN_H,
                borderRadius: m.ADD_BTN_R,
              },
              showInvite ? addBtnPressStyle : null,
            ]}>
            <View style={styles.addBtnBar} />
          </Animated.View>
        </View>

        {/* ================= family_edit: UserBottomSheet(미니) ================= */}
        {showEdit && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.sheet,
              {
                width: m.SHEET_W,
                height: m.SHEET_H,
                left: (m.W - m.SHEET_W) / 2,
                borderRadius: m.SHEET_R,
              },
              sheetStyle,
            ]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetTitle} />
            <View style={styles.sheetSub} />
            <View style={styles.sheetInput} />
            <View style={styles.sheetInput} />
            <View style={styles.sheetBtnRow}>
              <View style={styles.sheetBtnGhost} />
              <View style={styles.sheetBtnBlack} />
            </View>
          </Animated.View>
        )}

        {/* ================= my_mood: StateScreen 패널(미니) ================= */}
        {showMood && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.moodPanel,
              {
                width: m.MOOD_PANEL_W,
                height: m.MOOD_PANEL_H,
                left: (m.W - m.MOOD_PANEL_W) / 2,
                top: m.HEADER_H + m.TOP_YELLOW_H - getResponsiveHeight(14),
                borderRadius: m.MOOD_R,
              },
              moodPanelStyle,
            ]}>
            <View style={styles.moodTitle} />
            <View style={styles.moodGrid}>
              {Array.from({length: 8}).map((_, i) => (
                <View
                  key={`mood-${i}`}
                  style={[
                    styles.moodItem,
                    {
                      width: m.MOOD_ITEM,
                      height: m.MOOD_ITEM,
                      borderRadius: Math.round(m.MOOD_ITEM * 0.35),
                      marginRight: (i + 1) % 4 === 0 ? 0 : m.MOOD_GAP,
                      marginBottom: i < 4 ? m.MOOD_GAP : 0,
                    },
                    i === 6 ? styles.moodSelected : null, // 하나 선택된 느낌
                  ]}
                />
              ))}
            </View>
            <View style={styles.moodBottomBtn} />
          </Animated.View>
        )}

        {/* ================= family_invite: FamilyCodeModal(미니) ================= */}
        {showInvite && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.inviteModal,
              {
                width: m.MODAL_W,
                height: m.MODAL_H,
                left: (m.W - m.MODAL_W) / 2,
                top: Math.round(m.H * 0.33),
                borderRadius: m.R,
              },
              modalStyle,
            ]}>
            <View style={styles.modalTitle} />
            <View style={styles.codeCard}>
              <View style={styles.codeLeft}>
                <View style={styles.codeLabel} />
                <View style={styles.codeValue} />
              </View>

              <View style={styles.copyPill}>
                <View style={styles.copyText} />
                <Animated.View style={[styles.copiedBadge, copiedStyle]} />
              </View>
            </View>
            <View style={styles.modalHint} />
          </Animated.View>
        )}
      </View>
    </View>
  );
}

/**
 * =========================================================
 * ✅ Grid item renderer
 * - family_edit일 때 첫번째 아이템에 롱프레스 링(=pulseRingStyle)
 * =========================================================
 */
function renderGridItem({m, highlight = false, pulseRingStyle, isFirst = false}) {
  return (
    <View
      style={[
        styles.gridItem,
        {width: m.GRID_ITEM, height: m.GRID_ITEM, borderRadius: m.GRID_R},
      ]}>
      <View
        style={[
          styles.gridAvatar,
          {
            width: Math.round(m.GRID_ITEM * 0.44),
            height: Math.round(m.GRID_ITEM * 0.44),
            borderRadius: 999,
          },
        ]}
      />

      {highlight && isFirst && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pulseRing,
            {
              width: m.GRID_ITEM + 12,
              height: m.GRID_ITEM + 12,
              borderRadius: (m.GRID_ITEM + 12) / 2,
            },
            pulseRingStyle,
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {alignSelf: 'center'},

  canvas: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEF2F7',
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
  },

  topYellow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFC84D',
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: getResponsiveHeight(10),
    columnGap: getResponsiveWidth(12),
  },

  avatarArea: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  ring: {
    position: 'absolute',
    borderColor: '#EEF2F7',
    backgroundColor: '#FFFFFF',
  },

  avatar: {
    backgroundColor: '#E5E7EB',
  },

  emo: {
    position: 'absolute',
    backgroundColor: '#FFD36A',
    borderRadius: 999,
    opacity: 0,
  },

  headerCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEF2F7',
    paddingHorizontal: getResponsiveWidth(12),
    paddingTop: getResponsiveHeight(12),
    justifyContent: 'center',
  },

  topRightBtns: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconBtn: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#ECEFF3',
  },

  lineStrong: {
    width: '56%',
    height: getResponsiveHeight(10),
    borderRadius: 999,
    backgroundColor: '#111827',
    opacity: 0.12,
    marginBottom: getResponsiveHeight(8),
  },

  lineWeak: {
    width: '78%',
    height: getResponsiveHeight(9),
    borderRadius: 999,
    backgroundColor: '#111827',
    opacity: 0.08,
  },

  pulseRing: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255, 200, 77, 0.75)',
    backgroundColor: 'transparent',
  },

  gridArea: {
    flex: 1,
  },

  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  gridItem: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#EEF2F7',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  gridAvatar: {
    backgroundColor: '#D1D5DB',
  },

  dotBorder: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
  },

  dot: {
    position: 'absolute',
    backgroundColor: '#22C55E',
  },

  pill: {
    position: 'absolute',
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.16)',
    opacity: 0,
  },

  footer: {
    paddingTop: getResponsiveHeight(10),
    paddingBottom: getResponsiveHeight(12),
  },

  addBtn: {
    width: '100%',
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addBtnBar: {
    width: '58%',
    height: getResponsiveHeight(10),
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    opacity: 0.86,
  },

  // ===== BottomSheet mini =====
  sheet: {
    position: 'absolute',
    bottom: -getResponsiveHeight(10),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: getResponsiveWidth(12),
    paddingTop: getResponsiveHeight(10),
  },

  sheetHandle: {
    alignSelf: 'center',
    width: getResponsiveWidth(40),
    height: getResponsiveHeight(4),
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    marginBottom: getResponsiveHeight(10),
  },

  sheetTitle: {
    width: '40%',
    height: getResponsiveHeight(10),
    borderRadius: 999,
    backgroundColor: '#111827',
    opacity: 0.12,
    marginBottom: getResponsiveHeight(8),
  },

  sheetSub: {
    width: '70%',
    height: getResponsiveHeight(9),
    borderRadius: 999,
    backgroundColor: '#111827',
    opacity: 0.08,
    marginBottom: getResponsiveHeight(12),
  },

  sheetInput: {
    width: '100%',
    height: getResponsiveHeight(32),
    borderRadius: getResponsiveIconSize(10),
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: getResponsiveHeight(8),
  },

  sheetBtnRow: {
    flexDirection: 'row',
    columnGap: getResponsiveWidth(10),
    marginTop: getResponsiveHeight(6),
  },

  sheetBtnGhost: {
    flex: 1,
    height: getResponsiveHeight(38),
    borderRadius: getResponsiveIconSize(12),
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  sheetBtnBlack: {
    flex: 1,
    height: getResponsiveHeight(38),
    borderRadius: getResponsiveIconSize(12),
    backgroundColor: '#111827',
  },

  // ===== Mood panel mini =====
  moodPanel: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: getResponsiveWidth(12),
    paddingTop: getResponsiveHeight(10),
  },

  moodTitle: {
    width: '62%',
    height: getResponsiveHeight(10),
    borderRadius: 999,
    backgroundColor: '#111827',
    opacity: 0.10,
    marginBottom: getResponsiveHeight(12),
    alignSelf: 'center',
  },

  moodGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'center',
    justifyContent: 'center',
  },

  moodItem: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },

  moodSelected: {
    backgroundColor: '#FFF8E6',
    borderColor: '#FFC84D',
  },

  moodBottomBtn: {
    marginTop: getResponsiveHeight(12),
    height: getResponsiveHeight(34),
    borderRadius: 999,
    backgroundColor: '#111827',
    opacity: 0.92,
    alignSelf: 'center',
    width: '46%',
  },

  // ===== Invite modal mini =====
  inviteModal: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: getResponsiveWidth(12),
    paddingTop: getResponsiveHeight(10),
  },

  modalTitle: {
    width: '44%',
    height: getResponsiveHeight(10),
    borderRadius: 999,
    backgroundColor: '#111827',
    opacity: 0.10,
    marginBottom: getResponsiveHeight(10),
  },

  codeCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#EEF2F7',
    borderRadius: getResponsiveWidth(14),
    paddingVertical: getResponsiveHeight(12),
    paddingHorizontal: getResponsiveWidth(12),
  },

  codeLeft: {flex: 1, paddingRight: getResponsiveWidth(10)},

  codeLabel: {
    width: '48%',
    height: getResponsiveHeight(8),
    borderRadius: 999,
    backgroundColor: '#111827',
    opacity: 0.10,
    marginBottom: getResponsiveHeight(6),
  },

  codeValue: {
    width: '70%',
    height: getResponsiveHeight(10),
    borderRadius: 999,
    backgroundColor: '#111827',
    opacity: 0.08,
  },

  copyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(6),
    paddingVertical: getResponsiveHeight(8),
    paddingHorizontal: getResponsiveWidth(12),
    borderRadius: 999,
    backgroundColor: '#111827',
  },

  copyText: {
    width: getResponsiveWidth(22),
    height: getResponsiveHeight(9),
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    opacity: 0.85,
  },

  copiedBadge: {
    width: getResponsiveWidth(34),
    height: getResponsiveHeight(16),
    borderRadius: 999,
    backgroundColor: '#FFC84D',
    opacity: 0,
  },

  modalHint: {
    marginTop: getResponsiveHeight(10),
    width: '66%',
    height: getResponsiveHeight(9),
    borderRadius: 999,
    backgroundColor: '#111827',
    opacity: 0.08,
  },
});
