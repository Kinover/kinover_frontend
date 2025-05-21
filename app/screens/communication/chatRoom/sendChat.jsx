import React from 'react';
import {View, Text, StyleSheet, Image, FlatList} from 'react-native';
import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../../utils/responsive';
import formatTime from '../../../utils/formatTime';

export default function SendChat({
  chatTime,
  message,
  imageUrls = [],
  messageType = 'text',
  style,
}) {
  const renderImages = () => {
    if (imageUrls.length === 1) {
      return (
        <Image
          source={{uri: imageUrls[0]}}
          style={styles.singleImage}
          resizeMode="contain"
        />
      );
    }

    return (
      <FlatList
        data={imageUrls}
        keyExtractor={(item, index) => item + index}
        numColumns={3}
        renderItem={({item}) => (
          <Image source={{uri: item}} style={styles.imageItem} />
        )}
        scrollEnabled={false}
        contentContainerStyle={styles.imageGrid}
      />
    );
  };

  return (
    <View style={[styles.sendContainer, style]}>
      <Text style={styles.sendTime}>{formatTime(chatTime)}</Text>
      <View
        style={[
          styles.sendBubble,
          messageType === 'text' ? styles.textPadding : styles.imagePadding,
        ]}>
        {messageType === 'image' ? (
          renderImages()
        ) : (
          <Text style={styles.sendText}>{message}</Text>
        )}
      </View>
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
    borderRadius: 8,
    margin: 2,
  },
  singleImage: {
    width: getResponsiveWidth(200),
    height: getResponsiveHeight(200),
    borderRadius: 10,
  },
  
});
