import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { TapGestureHandler } from 'react-native-gesture-handler';

import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveIconSize,
} from '../../../../../utils/responsive';
import { SCREEN_HEIGHT as BS_SCREEN_HEIGHT } from '@gorhom/bottom-sheet';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const ITEM_WIDTH = SCREEN_WIDTH * 0.95;

export default function ImageCarousel({
  localImages,
  currentImageIndex,
  setCurrentImageIndex,
  setCommentIndex,
  commentCount,
}) {
  const mainCarouselRef = useRef(null);
  const fullCarouselRef = useRef(null);
  const panRef = useRef(null);
  const tapRef = useRef(null);

  const [isFullScreen, setIsFullScreen] = useState(false);

  // 메인 캐러셀: 외부 index 변경 시 스크롤 이동
  useEffect(() => {
    if (
      mainCarouselRef.current &&
      Number.isInteger(currentImageIndex) &&
      currentImageIndex >= 0 &&
      currentImageIndex < localImages?.length
    ) {
      mainCarouselRef.current.scrollTo?.({
        index: currentImageIndex,
        animated: false,
      });
    }
  }, [currentImageIndex, localImages?.length]);

  // 풀스크린 캐러셀: 열릴 때 현재 index로 스크롤
  useEffect(() => {
    if (
      isFullScreen &&
      fullCarouselRef.current &&
      Number.isInteger(currentImageIndex)
    ) {
      setTimeout(() => {
        fullCarouselRef.current.scrollTo?.({
          index: currentImageIndex,
          animated: false,
        });
      }, 0);
    }
  }, [isFullScreen, currentImageIndex]);

  const handleCommentToggle = () => setCommentIndex(prev => !prev);

  const renderMainItem = ({ item }) => (
    <TapGestureHandler
      ref={tapRef}
      numberOfTaps={1}
      waitFor={panRef}
      onActivated={() => setIsFullScreen(true)}
    >
      <View style={[styles.imageWrapper, { width: ITEM_WIDTH }]}>
        <Image source={{ uri: item }} style={styles.image} />

        {/* 하단 오버레이 */}
        <View style={styles.overlay}>
          <View style={styles.commentSection}>
            <TapGestureHandler
              simultaneousHandlers={panRef}
              onActivated={handleCommentToggle}
            >
              <Image
                source={require('../../../../../assets/icons/chatCircleDots.png')}
                style={styles.icon}
              />
            </TapGestureHandler>
            <Text style={styles.commentText}>{commentCount}</Text>
          </View>

          <Text style={styles.imageIndexText}>
            <Text style={styles.imageIndexCurrent}>{currentImageIndex + 1}</Text>
            {' / '}
            {localImages.length}
          </Text>
        </View>
      </View>
    </TapGestureHandler>
  );

  const renderFullScreenItem = ({ item }) => (
    <View style={styles.fullImageWrapper}>
      <Image source={{ uri: item }} style={styles.fullImage} />
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={() => setIsFullScreen(false)}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 메인 캐러셀 */}
      <Carousel
        ref={mainCarouselRef}
        width={SCREEN_WIDTH}
        height={BS_SCREEN_HEIGHT * 0.7}
        data={localImages}
        defaultIndex={currentImageIndex ?? 0}
        onSnapToItem={setCurrentImageIndex}
        loop={false}
        mode="parallax"
        scrollAnimationDuration={400}
        modeConfig={{
          parallaxScrollingScale: 0.8,
          parallaxAdjacentItemScale: 0.7,
        }}
        panGestureHandlerProps={{
          ref: panRef,
          activeOffsetX: [-1, 1],
          failOffsetY: [-30, 30],
          minDist: 1,
          minVelocityX: 0,
        }}
        renderItem={renderMainItem}
      />

      {/* 전체 화면 캐러셀 */}
      {isFullScreen && (
        <View style={styles.fullscreenOverlay}>
          <Carousel
            ref={fullCarouselRef}
            key={`full-${localImages?.length ?? 0}`}
            width={SCREEN_WIDTH}
            height={SCREEN_HEIGHT}
            data={localImages}
            defaultIndex={currentImageIndex ?? 0}
            onSnapToItem={setCurrentImageIndex}
            scrollAnimationDuration={300}
            loop={false}
            mode="normal"
            panGestureHandlerProps={{
              activeOffsetX: [-2, 2],
              failOffsetY: [-50, 50],
              minDist: 1,
              minVelocityX: 0,
            }}
            renderItem={renderFullScreenItem}
          />
        </View>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  imageWrapper: {
    height: '100%',
    borderRadius: getResponsiveIconSize(10),
    overflow: 'hidden',
    backgroundColor: 'white',
    alignSelf: 'center',
  },
  image: {
    flex: 1,
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '10%',
    backgroundColor: 'rgba(0, 0, 0, 0.57)',
    paddingHorizontal: getResponsiveWidth(15),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  commentSection: {
    flexDirection: 'row',
    gap: getResponsiveWidth(5),
    alignItems: 'center',
  },
  icon: {
    width: getResponsiveIconSize(25),
    height: getResponsiveIconSize(25),
  },
  commentText: {
    color: 'white',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(17),
  },
  imageIndexText: {
    color: 'white',
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Medium',
  },
  imageIndexCurrent: {
    color: '#FFC84D',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveIconSize(17),
  },
  fullscreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F9F9F9',
    zIndex: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImageWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  fullImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
});
