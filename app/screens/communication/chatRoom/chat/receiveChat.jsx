import React from 'react';
import { View, Image, Text, StyleSheet, FlatList } from 'react-native';
import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../../../utils/responsive';
import formatTime from '../../../../utils/formatTime';

export default function ReceiveChat({
  userProfileImage,
  userName,
  message,
  chatTime,
  style,
  messageType,
  imageUrls = [],
}) {
  const renderImages = () => {
    return (
      <FlatList
        data={imageUrls}
        keyExtractor={(item, index) => item + index}
        numColumns={3}
        renderItem={({ item }) => (
          <Image source={{ uri: item }} style={styles.imageItem} />
        )}
        scrollEnabled={false}
        contentContainerStyle={styles.imageGrid}
      />
    );
  };

  return (
    <View style={[styles.receivedContainer, style]}>
      <Image source={{ uri: userProfileImage }} style={styles.receivedUserImage} />

      <View style={styles.textContainer}>
        <Text style={styles.userName}>{userName}</Text>

        <View style={styles.messageContainer}>
          {/* ✅ 이미지 1장일 때는 말풍선 없이 */}
          {messageType === 'image' && imageUrls.length === 1 ? (
            <Image
              source={{ uri: imageUrls[0] }}
              style={styles.singleImage}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.receivedBubble,
                messageType === 'text' ? styles.textPadding : styles.imagePadding,
              ]}>
              {messageType === 'image' ? (
                renderImages()
              ) : (
                <Text style={styles.receivedText}>{message}</Text>
              )}
            </View>
          )}
          <Text style={styles.receivedTime}>{formatTime(chatTime)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  receivedContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  receivedUserImage: {
    width: getResponsiveWidth(45),
    height: getResponsiveWidth(45),
    borderRadius: getResponsiveWidth(25),
    backgroundColor: '#ddd',
    marginRight: getResponsiveWidth(10),
  },

  textContainer: {
    flex: 1,
    flexDirection: 'column',
  },

  userName: {
    fontSize: getResponsiveFontSize(13),
    color: '#444',
    marginBottom: getResponsiveHeight(10),
  },

  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },

  receivedBubble: {
    backgroundColor: '#FFECC3',
    borderRadius: getResponsiveIconSize(20),
    maxWidth: getResponsiveWidth(260),
    flexShrink: 1,
  },

  textPadding: {
    paddingVertical: getResponsiveHeight(10),
    paddingHorizontal: getResponsiveWidth(17),
  },

  imagePadding: {
    paddingVertical: getResponsiveHeight(4.5),
    paddingHorizontal: getResponsiveWidth(4.5),
  },

  receivedText: {
    fontFamily: 'Pretendard-Light',
    fontSize: getResponsiveFontSize(13),
    color: 'black',
    flexWrap: 'wrap',
    lineHeight: getResponsiveFontSize(18),
  },

  receivedTime: {
    fontSize: getResponsiveFontSize(10),
    color: '#666',
    marginLeft: getResponsiveWidth(5),
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
    aspectRatio: 1, // ✅ 비율 유지
    borderRadius: 10,
  },
});
