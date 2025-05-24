import React, {useState} from 'react';
import {View, Text, StyleSheet, Image, FlatList, TouchableOpacity} from 'react-native';
import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../../utils/responsive';
import formatTime from '../../../utils/formatTime';
import ImageModal from './imageModal';

export default function SendChat({
  chatTime,
  message,
  imageUrls = [],
  messageType = 'text',
  style,
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState('');

  const handleImagePress = uri => {
    setSelectedImageUri(uri);
    setModalVisible(true);
  };

  const renderImages = () => {
    if (imageUrls.length === 1) {
      return (
        <>
          <TouchableOpacity onPress={() => handleImagePress(imageUrls[0])}>
            <Image source={{uri: imageUrls[0]}} style={styles.singleImage} resizeMode="cover" />
          </TouchableOpacity>
        </>
      );
    }

    return (
      <View style={[styles.sendBubble, styles.imagePadding]}>
        <FlatList
          data={imageUrls}
          keyExtractor={(item, index) => item + index}
          numColumns={3}
          renderItem={({item}) => (
            <TouchableOpacity onPress={() => handleImagePress(item)}>
              <Image source={{uri: item}} style={styles.imageItem} />
            </TouchableOpacity>
          )}
          scrollEnabled={false}
          contentContainerStyle={styles.imageGrid}
        />
      </View>
    );
  };

  return (
    <View style={[styles.sendContainer, style]}>
      <Text style={styles.sendTime}>{formatTime(chatTime)}</Text>

      {messageType === 'image' ? (
        imageUrls.length === 1 ? renderImages() : renderImages()
      ) : (
        <View style={[styles.sendBubble, styles.textPadding]}>
          <Text style={styles.sendText}>{message}</Text>
        </View>
      )}

      <ImageModal
        visible={modalVisible}
        imageUri={selectedImageUri}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sendContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  sendBubble: {
    backgroundColor: '#FFECC3',
    borderRadius: getResponsiveIconSize(20),
    maxWidth: getResponsiveWidth(260),
    flexShrink: 1,
    alignSelf: 'flex-end',
  },
  textPadding: {
    paddingVertical: getResponsiveHeight(10),
    paddingHorizontal: getResponsiveWidth(17),
  },
  imagePadding: {
    paddingVertical: getResponsiveHeight(4.5),
    paddingHorizontal: getResponsiveWidth(4.5),
  },
  sendText: {
    fontFamily: 'Pretendard-Light',
    fontSize: getResponsiveFontSize(13),
    color: 'black',
    flexWrap: 'wrap',
    lineHeight: getResponsiveFontSize(18),
  },
  sendTime: {
    fontSize: getResponsiveFontSize(10),
    color: '#666',
    marginRight: getResponsiveWidth(5),
  },
  imageGrid: {
    gap: getResponsiveWidth(4),
  },
  imageItem: {
    width: getResponsiveWidth(70),
    height: getResponsiveWidth(70),
    borderRadius: 4,
    margin: 2,
  },
  singleImage: {
    width: getResponsiveWidth(200),
    aspectRatio: 1,
    borderRadius: 10,
    alignSelf: 'flex-end',
  },
});
