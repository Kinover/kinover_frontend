import React from 'react';
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
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
} from '../../../utils/responsive';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

export default function ImageModal({visible, imageUri, onClose}) {
  return (
    <Modal transparent={true} visible={visible} animationType="fade">
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType="light"
        blurAmount={5}
        reducedTransparencyFallbackColor="rgba(0,0,0,0.4)"
      />
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}>
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
      </TouchableOpacity>
      <View style={styles.closeButtonContainer}>
        <TouchableOpacity onPress={onClose}>
          <Text>x</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor:
      Platform.OS === 'android' ? 'rgba(0,0,0,0.7)' : 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
});
