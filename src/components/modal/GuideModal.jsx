// src/components/modal/GuideModal.jsx
// 젠스파크 스타일: 실제 탭 화면 위 딤+하이라이트(구멍)+말풍선+하단바 또는 미니 씬+말풍선+하단바
import React, {useCallback, useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {FadeIn, FadeOut} from 'react-native-reanimated';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
} from 'utils/responsive';
import GuideOverlay from './GuideOverlay';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const MAIN_YELLOW = '#FFC84D';
const OVERLAY_DIM = 'rgba(0,0,0,0.65)';
const BOTTOM_BAR_BG = '#1a1a1a';

/** description 안의 **텍스트** 를 굵게 파싱 (말풍선 본문용) */
function parseDescription(desc) {
  if (!desc || typeof desc !== 'string') return [];
  const parts = [];
  let lastEnd = 0;
  const re = /\*\*([^*]+)\*\*/g;
  let m;
  while ((m = re.exec(desc)) !== null) {
    if (m.index > lastEnd) parts.push({type: 'text', value: desc.slice(lastEnd, m.index)});
    parts.push({type: 'bold', value: m[1]});
    lastEnd = re.lastIndex;
  }
  if (lastEnd < desc.length) parts.push({type: 'text', value: desc.slice(lastEnd)});
  return parts;
}

/** 노란 말풍선 (꼬리 방향/위치 옵션) - VisualComponent 없을 때 또는 공통 UI */
export function CalloutBubble({
  title,
  description,
  style,
  tailPosition = 'top',
  tailOffset = 0,
}) {
  const descParts = parseDescription(description || '');
  const tailTransform =
    typeof tailOffset === 'number' && Math.abs(tailOffset) > 0.5
      ? [{translateX: tailOffset}]
      : undefined;

  return (
    <View style={[styles.calloutWrap, style]}>
      {tailPosition === 'top' && (
        <View
          style={[
            styles.calloutTail,
            tailTransform ? {transform: tailTransform} : null,
          ]}
        />
      )}
      <View style={styles.calloutBubble}>
        {!!title && (
          <Text allowFontScaling={false} style={styles.calloutTitle}>
            {title}
          </Text>
        )}
        {descParts.length > 0 && (
          <Text allowFontScaling={false} style={styles.calloutDesc}>
            {descParts.map((part, i) =>
              part.type === 'bold' ? (
                <Text key={i} allowFontScaling={false} style={styles.calloutDescBold}>
                  {part.value}
                </Text>
              ) : (
                part.value
              ),
            )}
          </Text>
        )}
      </View>
      {tailPosition === 'bottom' && (
        <View
          style={[
            styles.calloutTailBottom,
            tailTransform ? {transform: tailTransform} : null,
          ]}
        />
      )}
    </View>
  );
}

export default function GuideModalCarousel(props) {
  const {visible, onRequestClose, onAfterClose, steps = []} = props;
  const total = steps.length || 0;
  const prevVisibleRef = useRef(visible);

  // Android만: visible false 되면 200ms 뒤 onAfterClose (contentKey 리마운트). iOS는 Modal 안 쓰므로 불필요.
  useEffect(() => {
    if (prevVisibleRef.current && !visible) {
      prevVisibleRef.current = visible;
      if (Platform.OS === 'ios') return;
      const id = setTimeout(() => onAfterClose?.(), 200);
      return () => clearTimeout(id);
    }
    prevVisibleRef.current = visible;
  }, [visible, onAfterClose]);

  if (total === 0) return null;

  // RN Modal 대신 View 오버레이를 사용한다.
  if (!visible) return null;
  return (
    <View
      style={[StyleSheet.absoluteFillObject, {zIndex: 99999, elevation: 99999}]}
      pointerEvents="auto">
      <GuideModalCarouselInner {...props} />
    </View>
  );
}

function GuideModalCarouselInner({
  visible: _visible,
  steps = [],
  onRequestClose,
  onDone,
  titleFixed,
  nextText = '다음',
  doneText = '확인',
  VisualComponent,
  targetRef,
  targetRefsByKey,
}) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const [targetLayout, setTargetLayout] = useState(null);
  const total = steps.length || 1;
  const isLast = index === total - 1;
  const step = steps[index] || {};
  const title = titleFixed || step.title || '';
  const description = step.description || '';

  const currentTargetRef =
    (targetRefsByKey && step && targetRefsByKey[step.key]) || targetRef;
  const useRealScreen = !!currentTargetRef;

  useEffect(() => {
    setIndex(0);
  }, []);

  useEffect(() => {
    if (!useRealScreen || !currentTargetRef?.current) {
      setTargetLayout(null);
      return;
    }

    let cancelled = false;

    const measureLoop = () => {
      if (cancelled || !currentTargetRef?.current) return;

      currentTargetRef.current.measureInWindow((x, y, width, height) => {
        if (cancelled) return;

        // 레이아웃이 아직 안 잡혔으면 다음 프레임에 다시 측정 (Window 기준 좌표 정확도 확보)
        if (!width || !height) {
          requestAnimationFrame(measureLoop);
          return;
        }

        setTargetLayout({x, y, width, height});
      });
    };

    // 첫 측정은 다음 프레임으로 미뤄 레이아웃 안정화 후 measureInWindow 호출
    const id = requestAnimationFrame(measureLoop);

    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [useRealScreen, currentTargetRef, index]);

  const handleNext = useCallback(() => {
    if (isLast) {
      onDone?.();
    } else {
      setIndex(i => Math.min(i + 1, total - 1));
    }
  }, [isLast, onDone, total]);

  const handleSkip = useCallback(() => {
    onRequestClose?.();
  }, [onRequestClose]);

  if (total === 0) return null;

  if (useRealScreen) {
    return (
      <GuideOverlay
        targetLayout={targetLayout}
        step={{...step, title, description}}
        stepIndex={index}
        total={total}
        onSkip={handleSkip}
        onNext={handleNext}
        nextText={nextText}
        doneText={doneText}
      />
    );
  }

  return (
    <View style={styles.overlay}>
      <TouchableWithoutFeedback onPress={handleSkip}>
        <View style={styles.dimArea} />
      </TouchableWithoutFeedback>

      {/* 상단/중앙: 비주얼 또는 기본 말풍선 */}
      <View style={styles.contentArea} pointerEvents="box-none">
        {VisualComponent ? (
          <VisualComponent
            variant={step.key || 'family_status'}
            step={{...step, title: title || step.title, description: description || step.description}}
          />
        ) : (
          <Animated.View
            entering={FadeIn.duration(220)}
            exiting={FadeOut.duration(180)}
            style={styles.defaultBubbleWrap}>
            <CalloutBubble title={title} description={description} />
          </Animated.View>
        )}
      </View>

      {/* 하단 고정 바: 건너뛰기 | 1/3 | 다음 */}
      <View style={[styles.bottomBar, {paddingBottom: Math.max(insets.bottom, getResponsiveHeight(12))}]}>
        <TouchableOpacity onPress={handleSkip} hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
          <Text allowFontScaling={false} style={styles.skipText}>
            건너뛰기
          </Text>
        </TouchableOpacity>

        {total > 1 && (
          <Text allowFontScaling={false} style={styles.stepIndicator}>
            {index + 1}/{total}
          </Text>
        )}

        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
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
  overlay: {
    flex: 1,
    backgroundColor: OVERLAY_DIM,
  },
  dimArea: {
    ...StyleSheet.absoluteFillObject,
  },
  contentArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getResponsiveWidth(24),
  },
  defaultBubbleWrap: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calloutWrap: {
    alignSelf: 'stretch',
    maxWidth: SCREEN_WIDTH - getResponsiveWidth(48),
    alignItems: 'center',
    position: 'relative',
  },
  calloutBubble: {
    backgroundColor: MAIN_YELLOW,
    borderRadius: getResponsiveWidth(26),
    paddingHorizontal: getResponsiveWidth(24),
    paddingTop: getResponsiveHeight(18),
    paddingBottom: getResponsiveHeight(20),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  calloutTail: {
    position: 'absolute',
    top: -6,
    left: '50%',
    marginLeft: -10,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: MAIN_YELLOW,
  },
  calloutTailBottom: {
    position: 'absolute',
    bottom: -6,
    left: '50%',
    marginLeft: -10,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: MAIN_YELLOW,
  },
  calloutTitle: {
    fontSize: getResponsiveFontSize(17),
    fontFamily: 'Pretendard-SemiBold',
    color: '#111827',
    marginBottom: getResponsiveHeight(6),
    textAlign: 'center',
  },
  calloutDesc: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Regular',
    color: '#111827',
    lineHeight: getResponsiveHeight(22),
    textAlign: 'center',
  },
  calloutDescBold: {
    fontFamily: 'Pretendard-SemiBold',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BOTTOM_BAR_BG,
    paddingHorizontal: getResponsiveWidth(20),
    paddingTop: getResponsiveHeight(16),
  },
  skipText: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Regular',
    color: 'rgba(255,255,255,0.85)',
  },
  stepIndicator: {
    fontSize: getResponsiveFontSize(15),
    fontFamily: 'Pretendard-Medium',
    color: '#FFFFFF',
  },
  nextButton: {
    paddingHorizontal: getResponsiveWidth(28),
    paddingVertical: getResponsiveHeight(14),
    borderRadius: 999,
    backgroundColor: MAIN_YELLOW,
    minWidth: getResponsiveWidth(100),
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#EAB308',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  nextButtonText: {
    fontSize: getResponsiveFontSize(15),
    fontFamily: 'Pretendard-SemiBold',
    color: '#111827',
  },
});
