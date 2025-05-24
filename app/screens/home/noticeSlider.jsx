import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import NoticeCard from './noticeCard';

export default function NoticeSlider({ data, onPress }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const indexRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (indexRef.current + 1) % data.length;
      setCurrentIndex(nextIndex);
      indexRef.current = nextIndex;
    }, 3000);

    return () => clearInterval(interval);
  }, [data.length]);

  return (
    <View style={styles.sliderContainer}>
      <NoticeCard item={data[currentIndex]} onPress={onPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  sliderContainer: {
    display:'flex',
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
