import React from 'react';
import {View, Text, StyleSheet,Image} from 'react-native';
import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../../utils/responsive';
import formatTime from '../../../utils/formatTime';

export default function SendKinoChat({
  chatTime,
  imageUrls = [],
  messageType = 'text',
  message,
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
  };

  return (
    <View style={styles.sendContainer}>
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
  /** 🔹 발신 메시지 스타일 */
  sendContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end', // 오른쪽 정렬
    marginBottom: getResponsiveHeight(30),
  },

  sendBubble: {
    backgroundColor: '#FFECC3',
    borderRadius: getResponsiveIconSize(20),
    maxWidth: '85%',
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
    lineHeight: getResponsiveFontSize(18), // 줄 간격 설정
  },

  sendTime: {
    fontSize: getResponsiveFontSize(10),
    color: '#666',
    marginRight: getResponsiveWidth(5), // 말풍선 왼쪽에 위치
  },
  singleImage: {
    width: getResponsiveWidth(200),
    height: getResponsiveHeight(200),
    borderRadius: 10,
  },
});
