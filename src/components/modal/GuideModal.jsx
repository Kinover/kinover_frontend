// src/components/GuideModalCarousel.jsx
import React, {useCallback, useMemo, useRef, useState, useEffect} from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';
import CustomModal from './CustomModal';
import {getResponsiveHeight, getResponsiveWidth} from 'utils/responsive';

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
  visible,
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
      // ✅ Inner는 visible일 때만 mount되니까, CustomModal은 true 고정해도 됨
      visible={true}
      title={title}
      onRequestClose={onRequestClose}
      onClose={() => !isFirst && goTo(index - 1)}
      closeText={isFirst ? null : prevText}
      onConfirm={() => (isLast ? onDone?.() : goTo(index + 1))}
      confirmText={isLast ? doneText : nextText}
      showCloseButton>
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
        <View style={styles.topMetaRow}>
          <View style={styles.metaPill}>
            <Text allowFontScaling={false} style={styles.pageMeta}>
              {String(index + 1).padStart(2, '0')}
              <Text allowFontScaling={false} style={styles.pageMetaDim}>
                {' '}
                / {String(total).padStart(2, '0')}
              </Text>
            </Text>
          </View>
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

        <View style={styles.dots}>
          {Array.from({length: total}).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === index ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        <View style={{height: getResponsiveHeight(4)}} />
      </View>
    </CustomModal>
  );
}

const styles = StyleSheet.create({
  body: {
    alignItems: 'center',
    width: '100%',
  },

  topMetaRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: getResponsiveHeight(10),
  },

  metaPill: {
    paddingHorizontal: getResponsiveWidth(10),
    paddingVertical: getResponsiveHeight(6),
    borderRadius: 999,
    backgroundColor: 'rgba(17,24,39,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.06)',
  },

  pageMeta: {
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.2,
    color: '#111827',
  },
  pageMetaDim: {
    fontSize: 12.5,
    fontWeight: '700',
    color: 'rgba(17,24,39,0.35)',
  },

  page: {
    alignItems: 'center',
    width: '100%',
  },

  card: {
    width: '100%',
    borderRadius: getResponsiveWidth(18),
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.08)',
    backgroundColor: 'rgba(249,250,251,1)',
    paddingHorizontal: getResponsiveWidth(16),
    paddingVertical: getResponsiveHeight(16),
    minHeight: getResponsiveHeight(170),
    justifyContent: 'center',

    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 6},
    elevation: 2,
  },

  caption: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(17,24,39,0.45)',
    letterSpacing: 0.3,
    marginBottom: getResponsiveHeight(8),
  },

  desc: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 22,
    letterSpacing: -0.1,
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
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.06)',
    marginRight: 8,
  },
  hintTagText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    color: 'rgba(17,24,39,0.6)',
  },
  hintText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: 'rgba(17,24,39,0.55)',
    lineHeight: 18,
  },

  dots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },

  dot: {
    height: 6,
    borderRadius: 999,
  },
  dotInactive: {
    width: 6,
    backgroundColor: 'rgba(17,24,39,0.12)',
  },
  dotActive: {
    width: 18,
    backgroundColor: '#111827',
  },
});
