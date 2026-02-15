// src/components/GuideModalCarousel.jsx
import React, {useCallback, useMemo, useRef, useState, useEffect} from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';
import CustomModal from './CustomModal';
import {getResponsiveHeight, getResponsiveWidth, getResponsiveFontSize} from 'utils/responsive';
import {COLORS} from 'styles/style';

/**
 * ✅ Wrapper: 여기서는 Hook을 쓰지 않음
 * - visible=false면 아예 언마운트(return null)
 * - visible=true일 때만 Inner를 렌더 (Inner에서 Hook 사용)
 */
export default function GuideModalCarousel(props) {
  const {visible} = props;
  if (!visible) return null; // ✅ 여기서는 Hook이 없으니 안전
  return <GuideModalCarouselInner {...props} />;
}

/**
 * ✅ Inner: Hook은 항상 동일한 순서로만 실행됨
 */
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
  const flatRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [pageWidth, setPageWidth] = useState(0);

  const total = steps.length || 1;
  const isFirst = index === 0;
  const isLast = index === total - 1;

  // ✅ 컴포넌트 mount 시점(visible이 true일 때만 mount됨) 초기화
  useEffect(() => {
    setIndex(0);
    setPageWidth(0);

    requestAnimationFrame(() => {
      flatRef.current?.scrollToOffset?.({offset: 0, animated: false});
    });
  }, []);

  const title = useMemo(
    () => titleFixed || steps[index]?.title || '',
    [titleFixed, steps, index],
  );

  const goTo = useCallback(
    i => {
      const next = Math.max(0, Math.min(i, total - 1));
      setIndex(next);

      if (!pageWidth) return;
      flatRef.current?.scrollToOffset?.({
        offset: next * pageWidth,
        animated: true,
      });
    },
    [pageWidth, total],
  );

  const subtitle = useMemo(() => {
    const step = steps[index] || {};
    return step.subtitle || step.caption || '';
  }, [steps, index]);

  return (
    <CustomModal
      visible={true}
      title={title}
      onRequestClose={onRequestClose}
      onClose={isFirst ? onRequestClose : () => goTo(index - 1)}
      closeText={isFirst ? '건너뛰기' : prevText}
      onConfirm={() => (isLast ? onDone?.() : goTo(index + 1))}
      confirmText={isLast ? doneText : nextText}
      showCloseButton={false}
      closeButtonStyle={styles.chatSkipBtn}
      confirmButtonStyle={styles.chatNextBtn}
      closeTextStyle={styles.chatSkipText}
      confirmTextStyle={styles.chatNextText}
      buttonBottomStyle={styles.chatButtonRow}
      modalWrapperStyle={styles.guideModalWrapper}>
      <View
        style={styles.body}
        onLayout={e => {
          const w = e?.nativeEvent?.layout?.width ?? 0;
          if (!w) return;

          setPageWidth(prev => (prev === w ? prev : w));

          requestAnimationFrame(() => {
            flatRef.current?.scrollToOffset?.({
              offset: index * w,
              animated: false,
            });
          });
        }}>
        <View style={styles.stepBadge}>
          <Text allowFontScaling={false} style={styles.stepBadgeText}>
            {index + 1} / {total}
          </Text>
        </View>

        <Animated.FlatList
          ref={flatRef}
          data={steps}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={e => {
            if (!pageWidth) return;
            const i = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
            setIndex(i);
          }}
          renderItem={({item}) => (
            <View style={[styles.page, {width: pageWidth || '100%'}]}>
              <View style={styles.card}>
                {!!subtitle && (
                  <Text allowFontScaling={false} style={styles.caption}>
                    {subtitle}
                  </Text>
                )}

                {!!item.description && (
                  <Text allowFontScaling={false} style={styles.desc}>
                    {item.description}
                  </Text>
                )}

                {!!item.hint && (
                  <View style={styles.hintRow}>
                    <View style={styles.hintTag}>
                      <Text allowFontScaling={false} style={styles.hintTagText}>
                        TIP
                      </Text>
                    </View>
                    <Text allowFontScaling={false} style={styles.hintText}>
                      {item.hint}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        />
      </View>
    </CustomModal>
  );
}

const styles = StyleSheet.create({
  /** 하단 네비/가족 추가하기 바와 겹치지 않도록 모달을 위로 띄움 */
  guideModalWrapper: {
    marginBottom: getResponsiveHeight(100),
  },
  body: {
    alignItems: 'center',
    width: '100%',
  },

  stepBadge: {
    alignSelf: 'center',
    paddingHorizontal: getResponsiveWidth(12),
    paddingVertical: getResponsiveHeight(6),
    borderRadius: 999,
    backgroundColor: 'rgba(17,24,39,0.06)',
    marginBottom: getResponsiveHeight(12),
  },
  stepBadgeText: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-Medium',
    color: COLORS.textTertiary,
  },

  page: {
    alignItems: 'center',
    width: '100%',
  },

  card: {
    width: '100%',
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    paddingHorizontal: getResponsiveWidth(20),
    paddingVertical: getResponsiveHeight(20),
    minHeight: getResponsiveHeight(120),
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },

  caption: {
    fontSize: getResponsiveFontSize(11),
    fontFamily: 'Pretendard-Medium',
    color: COLORS.textTertiary,
    marginBottom: getResponsiveHeight(6),
  },

  desc: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Regular',
    color: '#374151',
    lineHeight: getResponsiveHeight(22),
    textAlign: 'left',
  },

  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: getResponsiveHeight(14),
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

  chatButtonRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: getResponsiveHeight(20),
    paddingBottom: getResponsiveHeight(2),
  },
  chatSkipBtn: {
    flex: 0,
    minWidth: undefined,
    height: undefined,
    paddingVertical: getResponsiveHeight(8),
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  chatSkipText: {
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveFontSize(13),
    color: COLORS.textTertiary,
  },
  chatNextBtn: {
    flex: 0,
    minWidth: undefined,
    height: undefined,
    paddingHorizontal: getResponsiveWidth(16),
    paddingVertical: getResponsiveHeight(8),
    borderRadius: 999,
    backgroundColor: '#FFC84D',
    borderWidth: 0,
  },
  chatNextText: {
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(13.5),
    color: '#111827',
  },
});
