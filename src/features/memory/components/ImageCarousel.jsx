// src/features/memory/components/ImageCarousel.jsx
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
import ImageViewer from './ImageViewer';

const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_WIDTH =
  Platform.OS === 'android' ? SCREEN_WIDTH * 0.98 : SCREEN_WIDTH * 0.97;

export default function ImageCarousel({
  localImages = [],
  currentImageIndex = 0,
  setCurrentImageIndex,
  setCommentIndex,
  commentCount = 0,
  isCommentMode = false,
  isImageFullScreen,
  setIsImageFullScreen,
}) {
  const mainCarouselRef = useRef(null);

  // ===== 댓글 모드 애니메이션 (RN Animated) =====
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

  const handleCommentToggle = () => setCommentIndex?.(prev => !prev);

  // =========================================================
  // ✅ 핵심 1) "단일 진실" currentImageIndex가 바뀌면
  //    메인 캐러셀도 즉시 scrollTo로 따라가게 만든다
  // =========================================================
  const lastSyncedRef = useRef(-1);
  useEffect(() => {
    const idx = Number.isInteger(currentImageIndex) ? currentImageIndex : 0;
    if (lastSyncedRef.current === idx) return;
    lastSyncedRef.current = idx;

    // 메인이 이미 렌더된 뒤에 이동시키는 게 안전함
    requestAnimationFrame(() => {
      mainCarouselRef.current?.scrollTo?.({
        index: idx,
        animated: false,
      });
    });
  }, [currentImageIndex]);

  const renderMainItem = ({item, index}) => (
    <View style={[styles.imageWrapper, {width: ITEM_WIDTH}]}>
      <TouchableOpacity
        style={styles.image}
        activeOpacity={1}
        onPress={() => {
          // ✅ 누른 순간 currentImageIndex 업데이트 + 뷰어 오픈
          setCurrentImageIndex?.(index);
          setIsImageFullScreen?.(true);
        }}>
        <Image source={{uri: item}} style={styles.image} />
      </TouchableOpacity>

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

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          width: SCREEN_WIDTH,
          height: animatedHeight,
          transform: [{translateY: animatedTranslateY}],
          alignItems: 'center',
        }}>
        <Carousel
          key={`main-${localImages?.length ?? 0}`}
          ref={mainCarouselRef}
          width={SCREEN_WIDTH}
          data={localImages}
          defaultIndex={currentImageIndex}
          onSnapToItem={idx => setCurrentImageIndex?.(idx)}
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

      {/* ✅ 같은 currentImageIndex를 공유하는 Viewer */}
      <ImageViewer
        visible={!!isImageFullScreen}
        images={localImages}
        index={currentImageIndex}              // ✅ 단일 진실
        onIndexChange={idx => setCurrentImageIndex?.(idx)} // ✅ 뷰어 스와이프 -> currentImageIndex 변경
        onClose={() => setIsImageFullScreen?.(false)}
      />
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
});
