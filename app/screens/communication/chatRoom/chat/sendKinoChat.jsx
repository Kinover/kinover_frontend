import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../../../utils/responsive';
import formatTime from '../../../../utils/formatTime';

export default function SendKinoChat({
  chatTime,
  imageUrls = [],
  messageType = 'text',
  message,
}) {
  return (
    <View style={styles.sendContainer}>
      <Text style={styles.sendTime}>{formatTime(chatTime)}</Text>

      {messageType === 'image' && imageUrls.length === 1 ? (
        <Image
          source={{ uri: imageUrls[0] }}
          style={styles.singleImage}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            styles.sendBubble,
            messageType === 'text' ? styles.textPadding : styles.imagePadding,
          ]}
        >
          {messageType === 'image' ? (
            <Image
              source={{ uri: imageUrls[0] }}
              style={styles.singleImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.sendText}>{message}</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
    lineHeight: getResponsiveFontSize(18),
  },

  sendTime: {
    fontSize: getResponsiveFontSize(10),
    color: '#666',
    marginRight: getResponsiveWidth(5),
  },

  singleImage: {
    width: getResponsiveWidth(200),
    aspectRatio: 1, // ✅ 원본 비율 유지
    borderRadius: 10,
    alignSelf: 'flex-end',
  },
});
