/* eslint-disable react/react-in-jsx-scope */
// src/hooks/schedule/useScheduleCountStyle.js
import {useCallback, useMemo} from 'react';
import {View, StyleSheet} from 'react-native';
import { getResponsiveHeight,getResponsiveWidth } from 'utils/responsive';

export const useScheduleCountStyle = cellSize => {
  const COUNT_COLORS = useMemo(
    () => ({
      1: '#FFC74D',
      2: '#FFB300',
      3: '#FF9F00',
      4: '#E68900',
    }),
    [],
  );

  const getCountColorStyle = useCallback(count => {
    if (count >= 4) {return {backgroundColor: '#FFB84D99'};}
    if (count === 3) {return {backgroundColor: '#FFC94D77'};}
    if (count === 2) {return {backgroundColor: '#FFD84D55'};}
    if (count === 1) {return {backgroundColor: '#FFEB4D33'};}
    return {};
  }, []);

  const renderCountBadge = useCallback(
    count => {
      if (!count || count <= 0) return null;
      const level = count >= 4 ? 4 : count;
      const size = cellSize * 0.22;
      return (
        <View
          style={[
            styles.countBadge,
            {
              backgroundColor: COUNT_COLORS[level],
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        />
      );
    },
    [cellSize, COUNT_COLORS],
  );

  return {
    getCountColorStyle,
    renderCountBadge,
  };
};

const styles = StyleSheet.create({
  countBadge: {
    position: 'absolute',
    bottom: getResponsiveHeight(6),
    right: getResponsiveWidth(6),
  },
});
