// 📁 cardSlider.jsx
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import getResponsiveFontSize, {
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from '../../utils/responsive';
import {
  TapGestureHandler,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

function AnimatedSlide({ item }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
      <Text style={styles.cardCategory}>{item.category}</Text>
      <Text style={styles.cardText}>{item.title}</Text>
      <Image source={item.image} style={styles.cardImage} />
    </Animated.View>
  );
}

export default function CardSlider({ data, containerWidth, onCardPress }) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <View style={styles.container}>
        <Text>No data available</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.cardBorder}>
          <Carousel
            loop
            width={containerWidth}
            height={containerWidth * 0.3}
            autoPlay={true}
            autoPlayInterval={2800}
            scrollAnimationDuration={1600}
            data={data}
            panGestureHandlerProps={{ activeOffsetX: [-10, 10] }}
            renderItem={({ item }) => (
              <TapGestureHandler
                numberOfTaps={1}
                maxDurationMs={250}
                maxDeltaX={5}
                maxDeltaY={5}
                onActivated={() => onCardPress?.(item)}
              >
                <View style={styles.contentContainer}>
                  <AnimatedSlide item={item} />
                </View>
              </TapGestureHandler>
            )}
          />
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
  },
  card: {
    width: '90%',
    height: '95%',
    borderRadius: getResponsiveIconSize(20),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 0.5,
    elevation: 4,
  },
  cardBorder: {
    width: '97%',
    height: '92%',
    borderRadius: getResponsiveIconSize(16),
    borderWidth: 4,
    borderColor: '#FFC84D',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  contentContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cardCategory: {
    position: 'absolute',
    left: getResponsiveHeight(20),
    top: getResponsiveHeight(12),
    fontSize: getResponsiveFontSize(17),
    fontFamily: 'Pretendard-SemiBold',
  },
  cardText: {
    position: 'absolute',
    fontSize: getResponsiveIconSize(13),
    fontFamily: 'Pretendard-Regular',
    textAlign: 'left',
    left: getResponsiveHeight(20),
    top: getResponsiveHeight(37),
    color: '#808080',
  },
  cardImage: {
    position: 'absolute',
    bottom: getResponsiveHeight(7),
    width: getResponsiveWidth(25),
    height: getResponsiveWidth(10),
    resizeMode: 'contain',
  },
});
