import React, {useEffect, useRef} from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import {SCREEN_HEIGHT as BS_SCREEN_HEIGHT} from '@gorhom/bottom-sheet';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveIconSize,
} from '../../../utils/responsive';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const ITEM_WIDTH =
  Platform.OS === 'android' ? SCREEN_WIDTH * 0.98 : SCREEN_WIDTH * 0.95;

export default function ImageCarousel({
  localImages,
  currentImageIndex,
  setCurrentImageIndex,
  setCommentIndex,
  commentCount,
  isCommentMode = false,
  // ✅ 부모에서 내려주는 풀스크린 상태
  isImageFullScreen,
  setIsImageFullScreen,
}) {
  const mainCarouselRef = useRef(null);
  const fullCarouselRef = useRef(null);

  // ===== 댓글 모드 애니메이션 =====
  const progressRef = useRef(new Animated.Value(isCommentMode ? 1 : 0));
  useEffect(() => {
    Animated.timing(progressRef.current, {
      toValue: isCommentMode ? 1 : 0,
      duration: 240,
      useNativeDriver: false,
    }).start();
  }, [isCommentMode]);

  const NORMAL_H = BS_SCREEN_HEIGHT * 0.7;
  const COMPACT_H = BS_SCREEN_HEIGHT * 0.42;

  const animatedHeight = progressRef.current.interpolate({
    inputRange: [0, 1],
    outputRange: [NORMAL_H, COMPACT_H],
  });

  const animatedTranslateY = progressRef.current.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });

  const overlayOpacity = progressRef.current.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0.6],
  });

  const overlayHeightPct = progressRef.current.interpolate({
    inputRange: [0, 1],
    outputRange: ['10%', '15%'],
  });

  // 외부 index 변경 시 동기화
  useEffect(() => {
    if (
      mainCarouselRef.current &&
      Number.isInteger(currentImageIndex) &&
      currentImageIndex >= 0 &&
      currentImageIndex < localImages?.length
    ) {
      setTimeout(() => {
        mainCarouselRef.current.scrollTo?.({
          index: currentImageIndex,
          animated: false,
        });
      }, 50);
    }
  }, [currentImageIndex, localImages?.length]);

  // 풀스크린 열릴 때 현재 index로 스크롤
  useEffect(() => {
    if (
      isImageFullScreen &&
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
  }, [isImageFullScreen, currentImageIndex]);

  const handleCommentToggle = () => setCommentIndex(prev => !prev);

  const renderMainItem = ({item}) => (
    <View style={[styles.imageWrapper, {width: ITEM_WIDTH}]}>
      <TouchableOpacity
        style={styles.image}
        activeOpacity={1}
        onPress={() => setIsImageFullScreen?.(true)} // ✅ 부모 상태로 열기
      >
        <Image source={{uri: item}} style={styles.image} />
      </TouchableOpacity>

      {/* 하단 오버레이 */}
      <Animated.View
        style={[
          styles.overlay,
          {
            backgroundColor: 'rgba(0,0,0,1)',
            opacity: overlayOpacity,
            height: overlayHeightPct,
          },
        ]}>
        <View style={styles.commentSection}>
          <TouchableOpacity onPress={handleCommentToggle}>
            <Image
              source={require('../../../assets/icons/chatCircleDots.png')}
              style={styles.icon}
            />
          </TouchableOpacity>
          <Text style={styles.commentText}>{commentCount}</Text>
        </View>

        <Text style={styles.imageIndexText}>
          <Text style={styles.imageIndexCurrent}>{currentImageIndex + 1}</Text>
          {' / '}
          {localImages.length}
        </Text>
      </Animated.View>
    </View>
  );

  const renderFullScreenItem = ({item}) => (
    <View style={styles.fullImageWrapper}>
      <Image source={{uri: item}} style={styles.fullImage} />
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={() => setIsImageFullScreen?.(false)} // ✅ 부모 상태로 닫기
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 메인 캐러셀 */}
      <Animated.View
        style={{
          width: SCREEN_WIDTH,
          height: animatedHeight,
          transform: [{translateY: animatedTranslateY}],
          alignItems: 'center',
        }}>
        <Carousel
          key={`main-carousel-${localImages?.length || 0}`} // ✅ index 제거
          ref={mainCarouselRef}
          width={SCREEN_WIDTH}
          height={undefined}
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
          renderItem={renderMainItem}
        />
      </Animated.View>

      {/* 전체 화면 캐러셀 */}
      {isImageFullScreen && (
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
    height: '100%',
    alignSelf: 'flex-start',
    marginTop:
      Platform.OS === 'ios'
        ? getResponsiveHeight(-40)
        : getResponsiveHeight(-10),
  },
  imageWrapper: {
    flex: 1,
    borderRadius: getResponsiveIconSize(10),
    overflow: 'hidden',
    backgroundColor: 'white',
    alignSelf: 'center',
  },
  image: {flex: 1, resizeMode: 'cover'},
  overlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '10%',
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
  icon: {width: getResponsiveIconSize(27), height: getResponsiveIconSize(27)},
  commentText: {
    color: 'white',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(17),
  },
  imageIndexText: {
    color: 'white',
    fontSize: getResponsiveFontSize(17),
    fontFamily: 'Pretendard-Medium',
  },
  imageIndexCurrent: {
    color: '#FFC84D',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveIconSize(20),
  },
  fullscreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F9F9F9',
    zIndex: 999,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImageWrapper: {width: SCREEN_WIDTH, height: SCREEN_HEIGHT},
  fullImage: {width: '100%', height: '100%', resizeMode: 'contain'},
});
