import React, {useEffect, useRef, useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Animated} from 'react-native';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../../utils/responsive';

const TABS = [
  {key: 'album', title: '앨범'},
  {key: 'allPhotos', title: '사진 전체보기'},
];

const BASE_UNDERLINE_WIDTH = 40; // 밑줄 기준 너비

export default function AnimatedAlbumTabSelector({selected, onSelect}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const scaleX = useRef(new Animated.Value(1)).current;
  const [positions, setPositions] = useState({});

  const handleLayout = (key, event) => {
    const {x, width} = event.nativeEvent.layout;
    setPositions(prev => ({
      ...prev,
      [key]: {x, width},
    }));
  };

  useEffect(() => {
    if (positions[selected]) {
      const {x, width} = positions[selected];
      const targetTranslateX = x + width / 2 - BASE_UNDERLINE_WIDTH / 2;
      const targetScaleX = width / BASE_UNDERLINE_WIDTH;

      Animated.parallel([
        Animated.timing(translateX, {
          toValue: targetTranslateX,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleX, {
          toValue: targetScaleX,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [selected, positions]);

  return (
    <View style={styles.container}>
      <View style={styles.tabRowContainer}>
        <View style={styles.tabRow}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => onSelect(tab.key)}
              style={styles.tab}
              activeOpacity={0.7}
              onLayout={e => handleLayout(tab.key, e)} // ✅ 여기에 onLayout!
            >
              <Text
                style={[
                  styles.tabText,
                  selected === tab.key && styles.selectedText,
                ]}>
                {' '}
                {tab.title}
              </Text>
            </TouchableOpacity>
          ))}
          <Animated.View
            style={[
              styles.underline,
              {
                transform: [{translateX}, {scaleX}],
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    paddingBottom: getResponsiveHeight(15),
    paddingVertical: getResponsiveHeight(5),
    paddingHorizontal: getResponsiveWidth(29),
  },
  tab: {
    marginRight: getResponsiveWidth(25),
  },
  tabText: {
    fontSize: getResponsiveFontSize(18),
    fontFamily: 'Pretendard-Bold',
    color: '#4A4A4A',
    textAlignVertical: 'bottom',
  },
  selectedText: {
    color: '#FFC84D',
  },

  tabRowContainer: {
    position: 'relative', // underline 위치 기준
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    position: 'relative', // underline이 이 안에서 움직이도록
  },
  underline: {
    height: 2,
    width: BASE_UNDERLINE_WIDTH + 5,
    backgroundColor: '#FFC84D',
    position: 'absolute',
    bottom: -13, // 탭 텍스트 바로 아래로 내리기 (필요에 따라 조절)
    left: 0,
  },
});

