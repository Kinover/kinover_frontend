// src/components/modal/GuideOverlay.jsx
// 실제 탭 화면 위에 딤 + 하이라이트(구멍) + 말풍선 + 하단바 (첨부 시안 구조)
import React, {useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, {Defs, Mask, Rect} from 'react-native-svg';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from 'utils/responsive';
import {CalloutBubble} from './GuideModal';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');
const OVERLAY_DIM = 'rgba(0,0,0,0.65)';
const BOTTOM_BAR_BG = 'transparent';
const PADDING = 20;
const HOLE_EXTRA_PADDING = 8;
const HIGHLIGHT_RADIUS = 20;
const POST_GUIDE_IMAGE = require('../../assets/kinos/post.png');

export default function GuideOverlay({
  targetLayout,
  suppressFallbackUntilMeasured = false,
  step = {},
  stepIndex = 0,
  total = 1,
  onSkip,
  onNext,
  nextText = '다음',
  doneText = '확인',
}) {
  const insets = useSafeAreaInsets();
  const isLast = stepIndex === total - 1;
  const title = step.title || '';
  const description = step.description || '';
  const key = step.key;
  const androidTopInset =
    Platform.OS === 'android' ? Number(insets.top || 0) : 0;

  let hasHole =
    targetLayout && targetLayout.width > 0 && targetLayout.height > 0;
  let rawX = targetLayout?.x ?? 0;
  let rawY = targetLayout?.y ?? 0;
  let w = targetLayout?.width ?? 0;
  let h = targetLayout?.height ?? 0;

  /**
   * 일부 스텝은 실제 ref 측정 대신, 화면 레이아웃을 기준으로
   * 타깃 위치를 직접 계산해준다.
   * (ref 측정이 성공했다면 hasHole이 true이므로 이 블록은 건너뜀)
   * - chat_action: 소통 탭 하단 + FAB
   * - add       : 일정 탭 하단 + FAB
   * - upload    : 추억 탭 하단 + FAB
   * - timeline  : 추억 탭 피드 카드 영역
   * - filter    : 추억 탭 상단 필터 바 영역
   */
  if (!hasHole && !suppressFallbackUntilMeasured) {
    if (key === 'chat_action' || key === 'add' || key === 'upload') {
      const fabSize = getResponsiveIconSize(65);
      const fabRight = getResponsiveWidth(13);
      const fabBottom = getResponsiveHeight(110);

      w = fabSize;
      h = fabSize;
      rawX = SCREEN_WIDTH - fabRight - fabSize;
      rawY = SCREEN_HEIGHT - fabBottom - fabSize;
      hasHole = true;
    } else if (key === 'timeline') {
      // 첫 게시글 카드 ref 측정 실패 시에도 "카드 1개" 크기만 대체 하이라이트한다.
      const side = SCREEN_WIDTH * 0.03; // MemoryFeed cardOuter marginHorizontal과 동일 비율
      const filterBarTop = getResponsiveHeight(210);
      const filterBarH = getResponsiveHeight(56);
      const cardGap = getResponsiveHeight(12);
      const belowFilterBar = filterBarTop + filterBarH + cardGap;

      w = SCREEN_WIDTH - side * 2;
      h = getResponsiveHeight(360);
      rawX = side;
      rawY = belowFilterBar;
      hasHole = true;
    } else if (key === 'filter') {
      const side = getResponsiveWidth(18);
      const barW = SCREEN_WIDTH - side * 2;
      const barH = getResponsiveHeight(56);

      // 상단 배너(MagazineBanner) 바로 아래의 기간·카테고리 필터 바 높이에 맞춰 조금 더 아래로 위치
      w = barW;
      h = barH;
      rawX = side;
      rawY = getResponsiveHeight(210);
      hasHole = true;
    }
  }

  // Android에서 좌표 기준이 살짝 위로 잡히는 경우가 있어 top inset만큼 보정한다.
  if (hasHole && androidTopInset > 0) {
    rawY += androidTopInset;
  }

  if (suppressFallbackUntilMeasured && !hasHole) {
    return (
      <View style={styles.container} pointerEvents="auto">
        <View style={styles.dimWrap} pointerEvents="none">
          <View style={[styles.dim, StyleSheet.absoluteFill]} />
        </View>
      </View>
    );
  }

  // 하이라이트: FAB는 원형 + 널널한 여백, 프로필/원형 타깃은 원형, 나머지는 모서리 둥근 사각
  const isFabStep = key === 'chat_action' || key === 'add' || key === 'upload';
  const isCircleTargetStep =
    key === 'family_status' || key === 'family_edit' || key === 'my_mood'; // 프로필·감정 버튼 등 원형 UI
  const holePadding = isFabStep
    ? getResponsiveWidth(10)
    : getResponsiveWidth(HOLE_EXTRA_PADDING);
  let holeX = Math.max(0, rawX - holePadding);
  let holeY = Math.max(0, rawY - holePadding);
  let holeW = Math.min(SCREEN_WIDTH - holeX, w + holePadding * 2);
  let holeH = Math.min(SCREEN_HEIGHT - holeY, h + holePadding * 2);
  let highlightRadius =
    isFabStep || isCircleTargetStep
      ? Math.min(holeW, holeH) / 2
      : getResponsiveWidth(HIGHLIGHT_RADIUS);

  // 프로필 등 원형 타깃: 구멍을 정사각형으로 해서 완전한 원으로 표시
  if (isCircleTargetStep && holeW !== holeH) {
    const side = Math.min(holeW, holeH);
    holeX = holeX + (holeW - side) / 2;
    holeY = holeY + (holeH - side) / 2;
    holeW = side;
    holeH = side;
    highlightRadius = side / 2;
  }

  const bubbleWidth = Math.min(
    SCREEN_WIDTH - getResponsiveWidth(48),
    getResponsiveWidth(320),
  );
  // 말풍선은 기본적으로 타깃의 가로 중앙에 맞추되, 좌우 패딩 안으로만 제한
  const bubbleLeft = hasHole
    ? Math.max(
        PADDING,
        Math.min(
          rawX + w / 2 - bubbleWidth / 2,
          SCREEN_WIDTH - bubbleWidth - PADDING,
        ),
      )
    : (SCREEN_WIDTH - bubbleWidth) / 2;

  const bubbleMargin = getResponsiveHeight(16);
  // iOS / Android 모두 동일한 레이아웃을 위해 bottomSafe를 고정 값으로 사용
  const bottomSafe = getResponsiveHeight(12) + getResponsiveHeight(72);
  const maxBubbleTop = SCREEN_HEIGHT - bottomSafe;

  // 단, FAB 계열 스텝은 항상 타깃 "위"에 말풍선이 오도록 강제
  let bubbleTop;
  if (hasHole) {
    const aboveMargin = getResponsiveHeight(24);
    const shouldForceAbove =
      key === 'family_invite' ||
      key === 'chat_action' ||
      key === 'timeline' ||
      key === 'add' ||
      key === 'upload';

    if (shouldForceAbove) {
      // 타깃 위쪽 고정 (iOS / Android 동일)
      bubbleTop = Math.max(
        PADDING,
        rawY - getResponsiveHeight(96) - aboveMargin,
      );
    } else {
      bubbleTop = rawY + h + bubbleMargin;
      if (bubbleTop > maxBubbleTop) {
        // 위로 올릴 때는 타깃과 거리를 조금 더 두어 버튼을 가리지 않도록 여유를 둔다
        bubbleTop = Math.max(
          PADDING,
          rawY - getResponsiveHeight(96) - aboveMargin,
        );
      }
    }
  }
  const stableBubbleLeft = Math.round(bubbleLeft);
  const stableBubbleTop = bubbleTop != null ? Math.round(bubbleTop) : undefined;

  // 하이라이트 박스에 살짝 펄스 모션
  const highlightPulse = useSharedValue(0);

  useEffect(() => {
    if (!hasHole) {
      return;
    }
    highlightPulse.value = 0;
    highlightPulse.value = withRepeat(
      withSequence(
        withTiming(1, {duration: 620, easing: Easing.out(Easing.quad)}),
        withTiming(0, {duration: 620, easing: Easing.in(Easing.quad)}),
      ),
      -1,
      false,
    );
  }, [hasHole, highlightPulse, stepIndex]);

  const highlightStyle = useAnimatedStyle(() => {
    const scale = 1 + highlightPulse.value * 0.06;
    const opacity = 0.55 + highlightPulse.value * 0.35;
    return {
      opacity,
      transform: [{scale}],
    };
  });

  const bubbleIsAboveTarget = hasHole && bubbleTop != null && bubbleTop < rawY;
  const showTimelineGuideImage = hasHole && key === 'timeline';

  // 꼬리 위치를 타깃 쪽으로 조금 치우치도록 가로 오프셋 계산
  let tailOffset = 0;
  if (hasHole) {
    const targetCenterX = rawX + w / 2;
    const bubbleCenterX = bubbleLeft + bubbleWidth / 2;
    const rawOffset = targetCenterX - bubbleCenterX;
    const maxOffset = bubbleWidth / 2 - getResponsiveWidth(36);
    if (Number.isFinite(rawOffset) && maxOffset > 0) {
      tailOffset = Math.round(
        Math.max(-maxOffset, Math.min(maxOffset, rawOffset)),
      );
    }
  }

  return (
    <View style={styles.container} pointerEvents="auto">
      <View style={styles.dimWrap} pointerEvents="none">
        {hasHole ? (
          <Svg
            width={SCREEN_WIDTH}
            height={SCREEN_HEIGHT}
            style={StyleSheet.absoluteFill}>
            <Defs>
              <Mask
                id="highlightMask"
                x="0"
                y="0"
                width={SCREEN_WIDTH}
                height={SCREEN_HEIGHT}>
                <Rect
                  x={0}
                  y={0}
                  width={SCREEN_WIDTH}
                  height={SCREEN_HEIGHT}
                  fill="#ffffff"
                />
                <Rect
                  x={holeX}
                  y={holeY}
                  width={holeW}
                  height={holeH}
                  rx={highlightRadius}
                  ry={highlightRadius}
                  fill="#000000"
                />
              </Mask>
            </Defs>
            <Rect
              x={0}
              y={0}
              width={SCREEN_WIDTH}
              height={SCREEN_HEIGHT}
              fill={OVERLAY_DIM}
              mask="url(#highlightMask)"
            />
          </Svg>
        ) : (
          <View style={[styles.dim, StyleSheet.absoluteFill]} />
        )}
      </View>

      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onNext}
        pointerEvents="auto"
      />

      {showTimelineGuideImage && (
        <View
          pointerEvents="none"
          style={[
            styles.timelineGuideImageWrap,
            {
              left: holeX,
              top: holeY,
              width: holeW,
              height: holeH,
              borderRadius: highlightRadius,
            },
          ]}>
          <Image
            source={POST_GUIDE_IMAGE}
            style={styles.timelineGuideImage}
            resizeMode="contain"
          />
        </View>
      )}

      {hasHole && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.highlightBox,
            {
              left: holeX,
              top: holeY,
              width: holeW,
              height: holeH,
              borderRadius: highlightRadius,
            },
            highlightStyle,
          ]}
        />
      )}

      <Animated.View
        entering={FadeIn.duration(160)}
        exiting={FadeOut.duration(130)}
        style={[
          styles.bubbleWrap,
          hasHole
            ? {
                position: 'absolute',
                left: stableBubbleLeft,
                top: stableBubbleTop,
                width: bubbleWidth,
              }
            : {marginHorizontal: getResponsiveWidth(24), alignSelf: 'center'},
        ]}
        pointerEvents="none">
        <CalloutBubble
          title={title}
          description={description}
          tailPosition={bubbleIsAboveTarget ? 'bottom' : 'top'}
          tailOffset={tailOffset}
        />
      </Animated.View>

      <View
        pointerEvents="auto"
        style={[
          styles.bottomBar,
          {paddingBottom: Math.max(insets.bottom, getResponsiveHeight(12))},
        ]}>
        <TouchableOpacity
          onPress={onSkip}
          hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
          style={styles.bottomLeftAction}>
          <Text allowFontScaling={false} style={styles.skipText}>
            건너뛰기
          </Text>
        </TouchableOpacity>

        <View
          pointerEvents="none"
          style={[
            styles.centerIndicatorWrap,
            {bottom: Math.max(insets.bottom, getResponsiveHeight(12))},
          ]}>
          {total > 1 && (
            <Text allowFontScaling={false} style={styles.stepIndicator}>
              {stepIndex + 1}/{total}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={onNext}
          activeOpacity={0.88}>
          <Text allowFontScaling={false} style={styles.nextButtonText}>
            {isLast ? doneText : nextText}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {...StyleSheet.absoluteFillObject},
  dimWrap: {...StyleSheet.absoluteFillObject},
  dim: {backgroundColor: OVERLAY_DIM},
  dimRow: {flexDirection: 'row'},
  highlightBox: {
    position: 'absolute',
    zIndex: 2,
    borderWidth: 2,
    borderColor: 'rgba(255,200,77,0.9)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  timelineGuideImageWrap: {
    position: 'absolute',
    zIndex: 1,
    overflow: 'hidden',
  },
  timelineGuideImage: {
    width: '100%',
    height: '100%',
  },
  bubbleWrap: {maxWidth: SCREEN_WIDTH - getResponsiveWidth(48), zIndex: 2},
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    elevation: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BOTTOM_BAR_BG,
    paddingHorizontal: getResponsiveWidth(20),
    paddingTop: getResponsiveHeight(16),
  },
  bottomLeftAction: {
    minWidth: getResponsiveWidth(80),
    height: getResponsiveHeight(52),
    justifyContent: 'center',
  },
  centerIndicatorWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: getResponsiveHeight(16),
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Regular',
    color: 'rgba(255,255,255,0.85)',
    lineHeight: getResponsiveHeight(20),
  },
  stepIndicator: {
    fontSize: getResponsiveFontSize(15),
    fontFamily: 'Pretendard-Medium',
    color: '#FFFFFF',
  },
  nextButton: {
    paddingHorizontal: getResponsiveWidth(28),
    height: getResponsiveHeight(52),
    borderRadius: 999,
    backgroundColor: '#FFC84D',
    minWidth: getResponsiveWidth(100),
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    fontSize: getResponsiveFontSize(15),
    fontFamily: 'Pretendard-SemiBold',
    color: '#111827',
  },
});
