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
import getResponsiveFontSize from '../../../utils/responsive';
import {
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../../utils/responsive';

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
          reducedTransparencyFallbackColor="rgba(0,0,0,0.3)"></BlurView>
      </View>

      {/* 이미지 줌 영역 (닫기 방지) */}
      <View style={styles.zoomContainer}>
        <ImageZoom
          cropWidth={screenWidth}
          cropHeight={screenHeight}
          imageWidth={getResponsiveWidth(320)}
          imageHeight={getResponsiveHeight(400)}>
          <Image
            source={{uri: imageUri}}
            style={{
              width: getResponsiveWidth(320),
              height: getResponsiveHeight(400),
              resizeMode: 'contain',
            }}
          />
        </ImageZoom>
      </View>
      {/* 닫기 버튼 */}
      <View style={styles.closeButtonContainer}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Text
            style={{
              fontSize: getResponsiveFontSize(24),
              color: '#FFC84D',
              fontWeight: 'bold',
            }}>
            ✕
          </Text>
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    // backgroundColor:
    //   Platform.OS === 'ios' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.3)',
  },
  zoomContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonContainer: {
    position: 'absolute',
    top: Platform.OS == 'ios' ? 70 : 20,
    right: 20,
    zIndex: 10,
  },
});
