import React from 'react';
import {
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
  Platform,
  Dimensions,
  Image,
  View,
  Text,
} from 'react-native';
import ImageZoom from 'react-native-image-pan-zoom';
import {
  getResponsiveHeight,
  getResponsiveWidth,
  getResponsiveFontSize,
} from '../../../../utils/responsive';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

export default function ImageModal({visible, imageUri, onClose}) {
  return (
    <Modal transparent={true} visible={visible} animationType="fade">
      {/* 전체 백그라운드 */}

      <View style={styles.overlay} />

      {/* 이미지 줌 영역 */}
      <View style={styles.zoomContainer}>
        <ImageZoom
          cropWidth={screenWidth}
          cropHeight={screenHeight}
          imageWidth={screenWidth}
          imageHeight={screenHeight}>
          <Image
            source={{uri: imageUri}}
            style={styles.zoomImage}
            resizeMode="contain"
          />
        </ImageZoom>
      </View>

      {/* 닫기 버튼 */}
      <View style={styles.closeButtonContainer}>
        <TouchableWithoutFeedback
          onPress={onClose}
          hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}>
          {/* <View
            style={{
              zIndex: 0,
              width: getResponsiveFontSize(25),
              height: getResponsiveFontSize(25),
              borderRadius: getResponsiveFontSize(12.5),
              backgroundColor: 'lightgray',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text style={styles.closeText}>✕</Text>
          </View> */}

          <Image
            source={require('../../../../assets/images/clearBt1.png')}
            style={{
              width: getResponsiveWidth(22.5),
              height: getResponsiveHeight(22.5),
              resizeMode: 'contain',
            }}></Image>
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a1a1a', // 완전한 블랙(#000)보다 덜 답답한 차콜톤
  },
  zoomContainer: {
    ...StyleSheet.absoluteFillObject,
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
      Platform.OS === 'ios' ? getResponsiveHeight(65) : getResponsiveHeight(30),
    right: getResponsiveWidth(15),
    zIndex: 10,
  },
  closeText: {
    zIndex: 10,
    fontSize:
      Platform.OS === 'ios'
        ? getResponsiveFontSize(15.5)
        : getResponsiveFontSize(10.5),
    color: 'gray',
    fontWeight: 'bold',
  },
});
