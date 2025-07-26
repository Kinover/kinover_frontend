import React from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Animated,
  FlatList,
  StyleSheet,
  Dimensions,
  Text,
  Platform,
} from 'react-native';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveIconSize,
} from '../../../../../utils/responsive';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ImageCarousel({
  localImages, // 이미지 배열
  scrollX, // 좌우 스크롤에 따라 애니메이션 조정용
  imageAnim, // 댓글창 열릴 때 이미지 작아지게 하는 애니메이션
  currentImageIndex, // 현재 이미지 인덱스 (상태)
  setCurrentImageIndex, // 인덱스 변경 함수
  setCommentIndex, // 댓글창 토글 함수
  onImagePress, // 👈 추가
}) {
  // 🔁 이미지 아이템 하나 렌더링 (캐러셀 안에 들어감)
  const renderImageItem = ({item, index}) => {
    // 🔄 현재 이미지 인덱스를 기준으로 스크롤 애니메이션 범위 설정
    const inputRange = [
      (index - 1) * SCREEN_WIDTH * 0.85,
      index * SCREEN_WIDTH * 0.85,
      (index + 1) * SCREEN_WIDTH * 0.85,
    ];

    // 👉 좌우 스크롤에 따라 이미지 살짝 작아졌다 커지는 애니메이션
    const scrollScale = scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.9],
      extrapolate: 'clamp',
    });

    // 🪄 댓글창 열릴 때 이미지 작아지는 애니메이션
    const animatedScale = imageAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.65],
    });

    // 📦 댓글창 열릴 때 이미지 위로 올라가는 애니메이션
    const translateY = imageAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-25, -170],
    });

    // 🎯 스크롤 애니메이션 + 댓글창 애니메이션 동시에 적용
    const combinedScale = Animated.multiply(scrollScale, animatedScale);

    return (
      <View style={styles.imageItemContainer}>
        <Animated.View
          style={[
            styles.memoryImageBox,
            {
              transform: [{scale: combinedScale}, {translateY}],
            },
          ]}>
          {/* ✅ 이미지 클릭 시 전체 화면 모드로 진입 */}
          <TouchableOpacity
            style={{flex: 1, backgroundColor: '#F9F9F9'}}
            onPress={() => onImagePress(item)}>
            <Image style={styles.memoryImage} source={{uri: item}} />
          </TouchableOpacity>

          {/* ❤️ 하단 오버레이: 좋아요 + 댓글 버튼 */}
          <View style={styles.imageOverlay}>
            <View style={{flexDirection: 'row', gap: getResponsiveWidth(7)}}>
              <TouchableOpacity onPress={() => setCommentIndex(prev => !prev)}>
                <Image
                  source={require('../../../../../assets/icons/chatCircleDots.png')}
                  style={styles.icon}
                />
              </TouchableOpacity>
              <Text
                style={{
                  alignSelf: 'center',
                  color: 'white',
                  fontFamily: 'Pretendard-SemiBold',
                  textAlign: 'center',
                  fontSize: getResponsiveFontSize(17),
                }}>
                {4}
              </Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-end',
              }}>
              <Text
                style={[
                  styles.imageIndexText,
                  {
                    color: '#FFC84D',
                    fontFamily: 'Pretendard-SemiBold',
                    fontSize: getResponsiveIconSize(17),
                  },
                ]}>
                {currentImageIndex + 1}
              </Text>
              <Text style={styles.imageIndexText}> / {localImages.length}</Text>
            </View>
          </View>
        </Animated.View>
      </View>
    );
  };

  return (
    <>
      {/* 🌕 이미지 여러 장일 때만 인덱스 표시 */}
      {/* {localImages?.length > 1 && (
        <View style={styles.imageIndexContainer}>
          <Text
            style={[
              styles.imageIndexText,
              {
                color: '#FFC84D',
                fontFamily: 'Pretendard-SemiBold',
                fontSize: getResponsiveIconSize(15),
              },
            ]}>
            {currentImageIndex + 1}
          </Text>
          <Text style={styles.imageIndexText}> / {localImages.length}</Text>
        </View>
      )} */}

      {/* 📲 이미지 캐러셀 (Animated FlatList 사용) */}
      <View style={styles.imageLayer}>
        <Animated.FlatList
          initialScrollIndex={currentImageIndex}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH * 0.85,
            offset: SCREEN_WIDTH * 0.85 * index,
            index,
          })}
          data={localImages} // 🧾 이미지 배열
          key={`carousel-${currentImageIndex}`} // 필요하면 리렌더 강제용
          horizontal
          pagingEnabled={false} // 📌 paging은 false → snapToInterval 사용
          showsHorizontalScrollIndicator={false}
          snapToInterval={SCREEN_WIDTH * 0.85} // 🎯 한 장씩 스냅되게
          decelerationRate="fast" // 💨 더 빠르게 스냅
          onScroll={Animated.event(
            [{nativeEvent: {contentOffset: {x: scrollX}}}],
            {useNativeDriver: false}, // 💡 scrollX 업데이트
          )}
          onMomentumScrollEnd={e => {
            const index = Math.round(
              e.nativeEvent.contentOffset.x / (SCREEN_WIDTH * 0.85),
            );
            setCurrentImageIndex(index); // 🔁 현재 인덱스 업데이트
          }}
          contentContainerStyle={{paddingHorizontal: SCREEN_WIDTH * 0.075}}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderImageItem}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  imageLayer: {
    flex: 1,
    zIndex: 0,
  },
  imageItemContainer: {
    width: SCREEN_WIDTH * 0.85,
    marginTop: '15%',
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoryImageBox: {
    width: Platform.OS == 'ios' ? '100%' : '95%',
    height: Platform.OS == 'ios' ? '70%' : '65%',
    backgroundColor: 'white',
    borderRadius: getResponsiveIconSize(10),
    marginTop: '15%',
    overflow: 'hidden',
  },
  memoryImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveWidth(15),
    backgroundColor: 'rgba(0, 0, 0, 0.57)',
    width: '100%',
    height: '10%',
    borderBottomEndRadius: 10,
    borderBottomStartRadius: 10,
  },
  icon: {
    width: getResponsiveIconSize(25),
    height: getResponsiveIconSize(25),
  },
  imageIndexContainer: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.57)',
    paddingHorizontal: getResponsiveWidth(20),
    paddingVertical: getResponsiveHeight(3),
    marginVertical: '7%',
    borderRadius: 30,
    zIndex: 3,
  },
  imageIndexText: {
    color: 'white',
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Medium',
  },
});
