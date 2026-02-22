// src/components/GuideModalCarousel.jsx
// 채팅방 가이드 모달(ChatRoomGuideModal)과 동일한 스타일 적용
import React, {useCallback, useMemo, useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import {getResponsiveHeight, getResponsiveWidth, getResponsiveFontSize} from 'utils/responsive';
import {COLORS} from 'styles/style';

/** description 안의 **텍스트** 를 굵게 파싱해서 반환 [{ type: 'text'|'bold', value }] */
function parseDescription(desc) {
  if (!desc || typeof desc !== 'string') return [];
  const parts = [];
  let lastEnd = 0;
  const re = /\*\*([^*]+)\*\*/g;
  let m;
  while ((m = re.exec(desc)) !== null) {
    if (m.index > lastEnd) parts.push({ type: 'text', value: desc.slice(lastEnd, m.index) });
    parts.push({ type: 'bold', value: m[1] });
    lastEnd = re.lastIndex;
  }
  if (lastEnd < desc.length) parts.push({ type: 'text', value: desc.slice(lastEnd) });
  return parts;
}

/**
 * ✅ Wrapper: visible=false면 언마운트
 */
export default function GuideModalCarousel(props) {
  const {visible} = props;
  if (!visible) return null;
  return <GuideModalCarouselInner {...props} />;
}

function GuideModalCarouselInner({
  visible: _visible,
  steps = [],
  onRequestClose,
  onDone,
  titleFixed,
  prevText = '이전',
  nextText = '다음',
  doneText = '확인',
}) {
  const [index, setIndex] = useState(0);
  const total = steps.length || 1;
  const isFirst = index === 0;
  const isLast = index === total - 1;

  useEffect(() => {
    setIndex(0);
  }, []);

  const step = steps[index] || {};
  const title = titleFixed || step.title || '';
  const caption = step.subtitle ?? step.caption ?? '';
  const descParts = useMemo(
    () => (step.description ? parseDescription(step.description) : []),
    [step.description],
  );

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

  return (
    <Modal transparent visible={true} animationType="fade" onRequestClose={handleSkip}>
      <TouchableWithoutFeedback onPress={handleSkip}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.content}>
              {total > 1 && (
                <Text allowFontScaling={false} style={styles.stepText}>
                  {index + 1}/{total}
                </Text>
              )}

              {!!title && (
                <Text allowFontScaling={false} style={styles.title}>
                  {title}
                </Text>
              )}
              {!!caption && (
                <Text allowFontScaling={false} style={styles.caption}>
                  {caption}
                </Text>
              )}
              {descParts.length > 0 && (
                <Text allowFontScaling={false} style={styles.description}>
                  {descParts.map((part, i) =>
                    part.type === 'bold' ? (
                      <Text
                        key={i}
                        allowFontScaling={false}
                        style={[styles.description, styles.descriptionBold]}>
                        {part.value}
                      </Text>
                    ) : (
                      part.value
                    ),
                  )}
                </Text>
              )}
              {!!step.hint && (
                <View style={styles.hintRow}>
                  <View style={styles.hintTag}>
                    <Text allowFontScaling={false} style={styles.hintTagText}>
                      TIP
                    </Text>
                  </View>
                  <Text allowFontScaling={false} style={styles.hintText}>
                    {step.hint}
                  </Text>
                </View>
              )}

              <View style={styles.buttonRow}>
                <TouchableOpacity onPress={handleSkip}>
                  <Text allowFontScaling={false} style={styles.skipText}>
                    건너뛰기
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                  <Text allowFontScaling={false} style={styles.nextButtonText}>
                    {isLast ? doneText : nextText}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: getResponsiveWidth(20),
    paddingBottom: getResponsiveHeight(26),
    justifyContent: 'center',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: getResponsiveWidth(18),
    paddingVertical: getResponsiveHeight(18),
  },
  stepText: {
    fontSize: getResponsiveFontSize(11),
    fontFamily: 'Pretendard-Medium',
    color: COLORS.textTertiary,
    marginBottom: getResponsiveHeight(4),
  },
  title: {
    fontSize: getResponsiveFontSize(17),
    fontFamily: 'Pretendard-SemiBold',
    color: '#111827',
    marginBottom: getResponsiveHeight(6),
  },
  caption: {
    fontSize: getResponsiveFontSize(11),
    fontFamily: 'Pretendard-Medium',
    color: COLORS.textTertiary,
    marginBottom: getResponsiveHeight(4),
  },
  description: {
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-Regular',
    color: '#4B5563',
    lineHeight: getResponsiveHeight(20),
    marginBottom: getResponsiveHeight(14),
    textAlign: 'center',
  },
  descriptionBold: {
    fontFamily: 'Pretendard-SemiBold',
    color: '#111827',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveHeight(14),
  },
  hintTag: {
    paddingHorizontal: getResponsiveWidth(8),
    paddingVertical: getResponsiveHeight(4),
    borderRadius: 999,
    backgroundColor: 'rgba(17,24,39,0.06)',
    marginRight: 8,
  },
  hintTagText: {
    fontSize: 11,
    fontFamily: 'Pretendard-SemiBold',
    color: 'rgba(17,24,39,0.6)',
  },
  hintText: {
    flex: 1,
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-Regular',
    color: '#4B5563',
    lineHeight: getResponsiveHeight(20),
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipText: {
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-Regular',
    color: COLORS.textTertiary,
  },
  nextButton: {
    paddingHorizontal: getResponsiveWidth(16),
    paddingVertical: getResponsiveHeight(8),
    borderRadius: 999,
    backgroundColor: '#FFC84D',
  },
  nextButtonText: {
    fontSize: getResponsiveFontSize(13.5),
    fontFamily: 'Pretendard-Medium',
    color: '#111827',
  },
});
