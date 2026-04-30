import React from 'react';
import {View, StyleSheet} from 'react-native';
import {getResponsiveHeight, getResponsiveWidth} from 'utils/responsive';
import {LAYOUT_STYLE} from 'styles/style';

const SKELETON_BG = '#E5E7EB';

export default function ScheduleScreenSkeleton() {
  const hPad = LAYOUT_STYLE().screenPaddingHorizontal;
  return (
    <View style={[styles.root, {paddingHorizontal: hPad}]} pointerEvents="none">
      <View style={styles.calendarCard}>
        <View style={styles.calendarHeaderRow}>
          <View style={styles.pillWide} />
          <View style={styles.pillShort} />
        </View>
        <View style={styles.weekRow}>
          {Array.from({length: 7}).map((_, i) => (
            <View key={`w-${i}`} style={styles.weekDot} />
          ))}
        </View>
        {Array.from({length: 5}).map((_, row) => (
          <View key={`row-${row}`} style={styles.gridRow}>
            {Array.from({length: 7}).map((_, col) => (
              <View key={`c-${row}-${col}`} style={styles.gridCell} />
            ))}
          </View>
        ))}
      </View>
      <View style={styles.listBlock}>
        <View style={styles.listTitle} />
        {[0, 1, 2].map(i => (
          <View key={`row-${i}`} style={styles.listRow}>
            <View style={styles.listAccent} />
            <View style={styles.listTextCol}>
              <View style={styles.lineLong} />
              <View style={styles.lineShort} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: getResponsiveHeight(5),
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: getResponsiveWidth(12),
    padding: getResponsiveWidth(14),
    marginBottom: getResponsiveHeight(12),
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: getResponsiveHeight(14),
  },
  pillWide: {
    width: '42%',
    height: getResponsiveHeight(18),
    borderRadius: 6,
    backgroundColor: SKELETON_BG,
  },
  pillShort: {
    width: '22%',
    height: getResponsiveHeight(18),
    borderRadius: 6,
    backgroundColor: SKELETON_BG,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: getResponsiveHeight(10),
  },
  weekDot: {
    width: getResponsiveWidth(22),
    height: getResponsiveWidth(22),
    borderRadius: 4,
    backgroundColor: SKELETON_BG,
  },
  gridRow: {
    flexDirection: 'row',
    gap: getResponsiveWidth(6),
    marginBottom: getResponsiveWidth(6),
  },
  gridCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: getResponsiveWidth(8),
    backgroundColor: SKELETON_BG,
  },
  listBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: getResponsiveWidth(12),
    padding: getResponsiveWidth(16),
  },
  listTitle: {
    width: '36%',
    height: getResponsiveHeight(16),
    borderRadius: 4,
    backgroundColor: SKELETON_BG,
    marginBottom: getResponsiveHeight(14),
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveHeight(12),
  },
  listAccent: {
    width: getResponsiveWidth(4),
    height: getResponsiveHeight(44),
    borderRadius: 2,
    backgroundColor: SKELETON_BG,
    marginRight: getResponsiveWidth(12),
  },
  listTextCol: {
    flex: 1,
    gap: getResponsiveHeight(8),
  },
  lineLong: {
    width: '88%',
    height: getResponsiveHeight(14),
    borderRadius: 4,
    backgroundColor: SKELETON_BG,
  },
  lineShort: {
    width: '52%',
    height: getResponsiveHeight(12),
    borderRadius: 4,
    backgroundColor: SKELETON_BG,
  },
});
