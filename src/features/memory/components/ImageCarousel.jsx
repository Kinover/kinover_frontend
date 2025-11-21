import React, {useEffect, useRef, useState} from 'react';
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
  Platform.OS === 'android' ? SCREEN_WIDTH * 0.98 : SCREEN_WIDTH * 0.97;

export default function ImageCarousel({
  localImages,
  currentImageIndex,
  setCurrentImageIndex,
  setCommentIndex,
  commentCount,
  isCommentMode = false,
  isImageFullScreen,
  setIsImageFullScreen,
}) {
  const mainCarouselRef = useRef(null);
  const fullCarouselRef = useRef(null);

  // ✅ 풀스크린 시작 인덱스를 이 컴포넌트 안에서 따로 관리
  const [fullStartIndex, setFullStartIndex] = useState(0);

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

  const handleCommentToggle = () => setCommentIndex(prev => !prev);

  // ✅ 풀스크린 닫힐 때, 메인 캐러셀도 마지막 인덱스로 싱크 (선택)
  const prevIsFullRef = useRef(isImageFullScreen);
  useEffect(() => {
    if (
      prevIsFullRef.current === true &&
      isImageFullScreen === false &&
      mainCarouselRef.current &&
      Number.isInteger(currentImageIndex)
    ) {
      mainCarouselRef.current.scrollTo?.({
        index: currentImageIndex,
        animated: false,
      });
    }
    prevIsFullRef.current = isImageFullScreen;
  }, [isImageFullScreen, currentImageIndex]);

  // ===== 렌더러들 =====
  const renderMainItem = ({item, index}) => (
    <View style={[styles.imageWrapper, {width: ITEM_WIDTH}]}>
      <TouchableOpacity
        style={styles.image}
        activeOpacity={1}
        onPress={() => {
          // ✅ 1. 부모 인덱스도 업데이트
          setCurrentImageIndex(index);
          // ✅ 2. 풀스크린 시작 인덱스를 로컬 state에 저장
          setFullStartIndex(index);
          // ✅ 3. 그 다음 풀스크린 열기
          setIsImageFullScreen?.(true);
        }}>
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
        onPress={() => setIsImageFullScreen?.(false)}
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
          key={`main-carousel-${localImages?.length || 0}`}
          ref={mainCarouselRef}
          width={SCREEN_WIDTH}
          height={undefined}
          data={localImages}
          defaultIndex={currentImageIndex ?? 0} // 처음 진입 기준
          onSnapToItem={index => setCurrentImageIndex(index)}
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
            key={`full-${localImages?.length ?? 0}`} // length 기준으로만 리마운트
            width={SCREEN_WIDTH}
            height={SCREEN_HEIGHT}
            data={localImages}
            defaultIndex={fullStartIndex} // ✅ 항상 내가 누른 index로 시작
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
  image: {
    flex: 1,
    resizeMode: 'cover',
  },
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
  icon: {
    width: getResponsiveIconSize(27),
    height: getResponsiveIconSize(27),
  },
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
