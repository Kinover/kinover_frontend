import React, {useState} from 'react';
import {
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
  Dimensions,
  Image,
  View,
  FlatList,
  Text,
  TouchableOpacity,
} from 'react-native';
import ImageZoom from 'react-native-image-pan-zoom';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../../../utils/responsive';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

export default function ImageModal({
  visible,
  imageUrls = [],
  initialIndex = 0,
  onClose,
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const navigation = useNavigation();
  return (
    <Modal transparent={true} visible={visible} animationType="fade">
      {/* 배경 */}
      <View style={styles.overlay} />

      {/* <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{flex:1}}> */}
      {/* ✅ 상단 인디케이터 */}
      {imageUrls?.length > 1 && (
        <View style={styles.indicatorContainer}>
          <Text style={styles.indicatorText}>
            {currentIndex + 1} / {imageUrls?.length}
          </Text>
        </View>
      )}
      {/* 닫기 버튼 */}
      <View style={styles.closeButtonContainer}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Image
            source={require('../../../../assets/images/clearBt1.png')}
            style={{
              width: getResponsiveWidth(22.5),
              height: getResponsiveHeight(22.5),
              resizeMode: 'contain',
            }}
          />
        </TouchableWithoutFeedback>
      </View>
      {/* </SafeAreaView> */}

      {/* 이미지 슬라이드 영역 */}
      <FlatList
        data={imageUrls}
        keyExtractor={(item, index) => item + index}
        horizontal
        pagingEnabled
        initialScrollIndex={initialIndex}
        getItemLayout={(data, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
        onMomentumScrollEnd={e => {
          const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
          setCurrentIndex(index);
        }}
        renderItem={({item}) => (
          <View style={styles.zoomContainer}>
            <ImageZoom
              cropWidth={screenWidth}
              cropHeight={screenHeight}
              imageWidth={screenWidth}
              imageHeight={screenHeight}>
              <Image
                source={{uri: item}}
                style={styles.zoomImage}
                resizeMode="contain"
              />
            </ImageZoom>
          </View>
        )}
      />
      {/* <TouchableOpacity
        style={{
          position: 'absolute',
          bottom: getResponsiveHeight(15),
          right: getResponsiveWidth(10),
          width: getResponsiveIconSize(60),
          height: getResponsiveIconSize(60),
          zIndex: 0,
        }}
        onPress={() => navigation.navigate('이미지선택화면')}>
        <Image
          source={require('../../../../assets/icons/posting-floating-bt.png')}
          style={{width: '100%', height: '100%', objectFit: 'contain'}}></Image>
      </TouchableOpacity> */}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a1a1a',
  },
  zoomContainer: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomImage: {
    width: screenWidth,
    height: screenHeight,
  },
  closeButtonContainer: {
    position: 'absolute',
    top:
      Platform.OS === 'ios' ? getResponsiveHeight(50) : getResponsiveHeight(20),
    right: getResponsiveWidth(15),
    zIndex: 10,
  },
  indicatorContainer: {
    position: 'absolute',
    top:
      Platform.OS === 'ios' ? getResponsiveHeight(50) : getResponsiveHeight(20),
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    zIndex: 10,
  },
  indicatorText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(14),
    fontWeight: '600',
  },
});
