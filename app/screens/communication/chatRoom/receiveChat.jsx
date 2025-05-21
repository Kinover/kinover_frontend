import React from 'react';
import {View, Image, Text, StyleSheet} from 'react-native';
import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../../utils/responsive';
import formatTime from '../../../utils/formatTime';

export default function ReceiveChat({
  userProfileImage,
  userName,
  message,
  chatTime,
  style,
  messageType,
  imageUrls,
}) {
  const renderImages = () => {
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
    <View style={[styles.receivedContainer, style]}>
      {/* 프로필 이미지 */}
      <Image
        source={{uri: `${userProfileImage}`}}
        style={styles.receivedUserImage}
      />

      {/* 유저 이름 & 말풍선 */}
      <View style={styles.textContainer}>
        {/* 유저 이름 */}
        <Text style={styles.userName}>{userName}</Text>

        {/* 메시지 & 시간 */}
        <View style={styles.messageContainer}>
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
          <Text style={styles.receivedTime}>{formatTime(chatTime)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  receivedContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start', // 프로필 이미지와 텍스트 정렬
  },

  /** 🔹 프로필 이미지 */
  receivedUserImage: {
    width: getResponsiveWidth(45),
    height: getResponsiveWidth(45),
    borderRadius: getResponsiveWidth(25),
    backgroundColor: '#ddd',
    marginRight: getResponsiveWidth(10), // 유저이름과 간격
  },

  /** 🔹 유저 이름 & 메시지 */
  textContainer: {
    flex: 1,
    flexDirection: 'column',
  },

  userName: {
    fontSize: getResponsiveFontSize(13),
    color: '#444',
    marginBottom: getResponsiveHeight(10), // 이름 아래 간격
  },

  /** 🔹 메시지 & 시간 */
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
    lineHeight: getResponsiveFontSize(18), // 줄 간격 설정
  },

  receivedTime: {
    fontSize: getResponsiveFontSize(10),
    color: '#666',
    marginLeft: getResponsiveWidth(5), // 말풍선 왼쪽에 위치
  },
});
