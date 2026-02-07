// src/components/GuideModalCarousel.jsx
import React, {useCallback, useMemo, useRef, useState} from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';
import CustomModal from './CustomModal';
import {getResponsiveHeight, getResponsiveWidth} from 'utils/responsive';

export default function GuideModalCarousel({
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

  const title = useMemo(
    () => titleFixed || steps[index]?.title || '살펴보기',
    [titleFixed, steps, index],
  );

  const goTo = useCallback(
    i => {
      const next = Math.max(0, Math.min(i, total - 1));
      setIndex(next);
      if (!pageWidth) return;
      flatRef.current?.scrollToOffset({
        offset: next * pageWidth,
        animated: true,
      });
    },
    [pageWidth, total],
  );

  return (
    <CustomModal
      visible={visible}
      title={title}
      onRequestClose={onRequestClose}
      onClose={() => !isFirst && goTo(index - 1)}
      closeText={isFirst ? null : prevText}
      onConfirm={() => (isLast ? onDone?.() : goTo(index + 1))}
      confirmText={isLast ? doneText : nextText}
      showCloseButton

    >
      <View
        style={styles.body}
        onLayout={e => setPageWidth(e.nativeEvent.layout.width)}
      >
        <Animated.FlatList
          ref={flatRef}
          data={steps}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={e => {
            const i = Math.round(
              e.nativeEvent.contentOffset.x / pageWidth,
            );
            setIndex(i);
          }}
          renderItem={({item}) => (
            <View style={[styles.page, {width: pageWidth}]}>
              <View
                style={[
                  styles.visual,
                  {height: getResponsiveHeight(item.visualHeight ?? 260)},
                ]}
              >
                {item.renderVisual?.()}
              </View>

              {!!item.description && (
                <Text allowFontScaling={false} style={styles.desc}>{item.description}</Text>
              )}
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
      </View>
    </CustomModal>
  );
}

const styles = StyleSheet.create({
  body: {alignItems: 'center'},
  page: {alignItems: 'center'},
  visual: {
    width: '100%',
    borderRadius: getResponsiveWidth(18),
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.08)',
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  desc: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
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
    backgroundColor: 'rgba(17,24,39,0.18)',
  },
  dotActive: {
    width: 22,
    backgroundColor: '#111827',
  },
});
