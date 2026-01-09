/* eslint-disable react-native/no-inline-styles */
// src/screens/memory/components/PostFilterBar.jsx

import React, {useMemo, useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  Pressable,
  Platform,
} from 'react-native';

import {
  getResponsiveFontSize,
  getResponsiveWidth,
  getResponsiveHeight,
} from '../../../utils/responsive';

// ✅ 여기! alias 쓰면 터질 수 있어서 상대경로로 고정
import {BUTTON_STYLES} from '../../../styles/style';

const DEFAULT_SORT_OPTIONS = [
  {key: 'latest', title: '최신순'},
  {key: 'oldest', title: '오래된순'},
];

const formatPeriodLabel = raw => {
  if (!raw) return '';

  const formatDate = d => {
    const parts = (d || '').split('.');
    if (parts.length !== 3) return d;
    const [year, month, day] = parts;
    const yy = (year || '').slice(-2);
    return `${yy}.${month}.${day}`;
  };

  const segments = raw.split('~').map(s => s.trim());
  if (segments.length === 2) {
    return `${formatDate(segments[0])} ~ ${formatDate(segments[1])}`;
  }
  return formatDate(segments[0]);
};

export default function PostFilterBar({
  categoryTitle = '전체글',
  onPressCategory,
  periodLabel,
  onPressDateFilter,
  sortKey = 'latest',
  onChangeSort,
  sortOptions = DEFAULT_SORT_OPTIONS,
}) {
  const [sortModalOpen, setSortModalOpen] = useState(false);

  const sortTitle = useMemo(() => {
    const found = (sortOptions || []).find(v => v.key === sortKey);
    return found?.title || '최신순';
  }, [sortKey, sortOptions]);

  const displayPeriodLabel = useMemo(() => {
    return periodLabel ? formatPeriodLabel(periodLabel) : '기간 선택';
  }, [periodLabel]);

  const isPeriodActive = !!periodLabel;

  // ✅ 정렬도 기간 버튼처럼 "활성/비활성" 톤을 맞춰서 통일감 주기
  // - 기본값(latest)이면 비활성(회색 톤)
  // - 기본값이 아니면 활성(진한 톤 + pillActive)
  const isSortActive = sortKey !== 'latest';

  const openSort = useCallback(() => setSortModalOpen(true), []);
  const closeSort = useCallback(() => setSortModalOpen(false), []);

  const pickSort = useCallback(
    key => {
      onChangeSort && onChangeSort(key);
      setSortModalOpen(false);
    },
    [onChangeSort],
  );

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.categoryButton}
          onPress={onPressCategory}
          activeOpacity={0.7}>
          <Text style={styles.categoryText}>{categoryTitle}</Text>
          <Image
            source={require('../../../assets/icons/down-arrow.png')}
            style={styles.downIcon}
          />
        </TouchableOpacity>

        <View style={styles.rightControls}>
          <TouchableOpacity
            style={[
              styles.pillButton,
              styles.periodButton,
              isPeriodActive && styles.pillActive,
            ]}
            activeOpacity={0.7}
            onPress={onPressDateFilter}>
            <Image
              source={require('../../../assets/icons/calendar.png')}
              style={[
                styles.calendarIcon,
                isPeriodActive && styles.calendarIconActive,
              ]}
            />
            <Text
              style={[styles.pillText, isPeriodActive && styles.pillTextActive]}
              numberOfLines={1}
              ellipsizeMode="tail">
              {displayPeriodLabel}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.pillButton,
              styles.sortButton,
              isSortActive && styles.pillActive,
            ]}
            activeOpacity={0.7}
            onPress={openSort}>
            <Text
              style={[styles.pillText, isSortActive && styles.pillTextActive]}>
              {sortTitle}
            </Text>
            <Image
              source={require('../../../assets/icons/down-arrow.png')}
              style={[
                styles.sortDownIcon,
                isSortActive && styles.sortDownIconActive,
              ]}
            />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={sortModalOpen}
        transparent
        animationType="fade"
        onRequestClose={closeSort}>
        <Pressable style={styles.modalBackdrop} onPress={closeSort} />
        <View style={styles.modalSheetWrap}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>정렬</Text>

            {(sortOptions || []).map(opt => {
              const active = opt.key === sortKey;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.optionRow, active && styles.optionRowActive]}
                  activeOpacity={0.7}
                  onPress={() => pickSort(opt.key)}>
                  <Text
                    style={[
                      styles.optionText,
                      active && styles.optionTextActive,
                    ]}>
                    {opt.title}
                  </Text>

                  {active ? (
                    <View style={styles.dot} />
                  ) : (
                    <View style={[styles.dot, styles.dotInactive]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveWidth(5),
    paddingTop: getResponsiveHeight(5),
    paddingBottom: getResponsiveHeight(5),
  },

  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(4),
    paddingVertical: getResponsiveHeight(6),
    paddingRight: getResponsiveWidth(6),
  },
  categoryText: {
    fontFamily: 'Pretendard-SemiBold',
    fontWeight: '600', // ❌ 'semibold'는 RN에서 invalid라서 숫자로 고정
    fontSize: getResponsiveFontSize(13),
    lineHeight: getResponsiveHeight(17),
    // color: '#111827',
    color: '#525252',
  },
  downIcon: {
    resizeMode: 'contain',
    width: getResponsiveWidth(16),
    height: getResponsiveWidth(16),
  },

  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(10),
  },

  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveWidth(4),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: getResponsiveWidth(11),
    paddingVertical: getResponsiveHeight(6),
    ...Platform.select({
      android: {paddingVertical: getResponsiveHeight(6)},
      ios: {paddingVertical: getResponsiveHeight(6)},
    }),
  },

  periodButton: {maxWidth: getResponsiveWidth(220)},
  sortButton: {paddingHorizontal: getResponsiveWidth(9)},

  pillActive: {
    borderColor: BUTTON_STYLES?.backgroundColor ?? '#525252',

    backgroundColor: '#FFFFFF',
  },

  pillText: {
    fontSize: getResponsiveFontSize(11.5),
    fontFamily: 'Pretendard-Medium',
    color: '#9CA3AF',
  },
  pillTextActive: {
    fontFamily: 'Pretendard-SemiBold',
    color: '#525252',
  },

  calendarIcon: {
    width: getResponsiveWidth(13),
    height: getResponsiveWidth(13),
    tintColor: '#9CA3AF',
  },
  calendarIconActive: {tintColor: '#525252'},

  // ✅ 정렬 아이콘도 기간 버튼 톤과 동일 규칙(기본 회색 → 활성 검정)
  sortDownIcon: {
    resizeMode: 'contain',
    width: getResponsiveWidth(14),
    height: getResponsiveWidth(14),
    tintColor: '#9CA3AF',
  },
  sortDownIconActive: {tintColor: '#525252'},

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  modalSheetWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: getResponsiveWidth(16),
    paddingBottom: getResponsiveHeight(18),
  },

  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: getResponsiveHeight(14),
    paddingHorizontal: getResponsiveWidth(14),
  },

  modalTitle: {
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'Pretendard-Bold',
    color: '#525252',
    marginBottom: getResponsiveHeight(8),
  },

  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: getResponsiveHeight(12),
    paddingHorizontal: getResponsiveWidth(8),
    borderRadius: 12,
  },

  optionRowActive: {backgroundColor: 'rgba(17,24,39,0.04)'},

  optionText: {
    fontSize: getResponsiveFontSize(15),
    fontFamily: 'Pretendard-Medium',
    color: '#525252',
  },

  optionTextActive: {fontFamily: 'Pretendard-Bold'},

  dot: {
    width: getResponsiveWidth(10),
    height: getResponsiveWidth(10),
    borderRadius: 999,
    backgroundColor: '#525252',
  },

  dotInactive: {backgroundColor: '#E5E7EB'},
});
