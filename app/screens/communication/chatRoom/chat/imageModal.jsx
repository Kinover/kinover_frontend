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
import {BlurView} from '@react-native-community/blur';
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
      <View style={styles.overlay}>
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="dark"
          blurAmount={1}
          reducedTransparencyFallbackColor="rgba(0,0,0,0.3)"
        />
      </View>

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
        <TouchableWithoutFeedback onPress={onClose}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
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
    top: Platform.OS === 'ios'
      ? getResponsiveHeight(70)
      : getResponsiveHeight(30),
    right: getResponsiveWidth(20),
    zIndex: 10,
  },
  closeText: {
    fontSize: getResponsiveFontSize(24),
    color: '#FFC84D',
    fontWeight: 'bold',
  },
});
