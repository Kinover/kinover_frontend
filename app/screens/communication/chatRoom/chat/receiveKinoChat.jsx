import React, {useEffect, useRef, useState} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, Platform} from 'react-native';
import FastImage from 'react-native-fast-image';
import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../../../utils/responsive';
import formatTime from '../../../../utils/formatTime';
import ImageModal from './imageModal';

import {
  registerTimeLast,
  unregisterTimeLast,
  minuteKey,
  toEpochMs,
} from '../../../../utils/chat/timeRegistry';
import {getSpacingStyle} from '../../../../utils/chat/getSpacingStyle';

export default function ReceiveKinoChat({
  message,
  chatTime,
  messageType = 'text',
  imageUrls = [],
  isGrouped = false,
  isSameSender = false,
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // --- 마지막만 시간 표시 로직 ---
  const [showTime, setShowTime] = useState(false);
  const idRef = useRef(Math.random().toString(36).slice(2));

  const key = `KINO|${minuteKey(chatTime)}`;
  const timeMs = toEpochMs(chatTime);

  useEffect(() => {
    registerTimeLast(key, idRef.current, timeMs, setShowTime);
    return () => unregisterTimeLast(key, idRef.current);
  }, [key, timeMs]);

  // === 간격 계산 ===
  const spacingStyle = getSpacingStyle({isGrouped, isSameSender});

  const handleImagePress = (uri, index) => {
    setSelectedIndex(index);
    setModalVisible(true);
  };

  const renderImages = () => (
    <FlatList
      data={imageUrls}
      keyExtractor={(item, index) => item + index}
      numColumns={3}
      renderItem={({item, index}) => (
        <TouchableOpacity onPress={() => handleImagePress(item, index)}>
          <FastImage source={{uri: item}} style={styles.imageItem} />
        </TouchableOpacity>
      )}
      scrollEnabled={false}
      contentContainerStyle={styles.imageGrid}
    />
  );

  return (
    <View style={[styles.receivedContainer, spacingStyle]}>
      <View style={styles.textContainer}>
        <View style={styles.messageContainer}>
          {messageType === 'image'
            ? imageUrls.length === 1
              ? (
                <TouchableOpacity onPress={() => handleImagePress(imageUrls[0], 0)}>
                  <FastImage
                    source={{uri: imageUrls[0]}}
                    style={styles.singleImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              )
              : renderImages()
            : (
              <View style={styles.receivedBubble}>
                <Text style={styles.receivedText}>{message}</Text>
              </View>
            )}
          {showTime && <Text style={styles.receivedTime}>{formatTime(chatTime)}</Text>}
        </View>
      </View>

      <ImageModal
        visible={modalVisible}
        imageUrls={imageUrls}
        initialIndex={selectedIndex}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

/* ===== 스타일 ===== */
const styles = StyleSheet.create({
  receivedContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  textContainer: {flex: 1, flexDirection: 'column'},
  messageContainer: {flexDirection: 'row', alignItems: 'flex-end'},

  receivedBubble: {
    backgroundColor: '#FFC84D',
    borderRadius: getResponsiveIconSize(20),
    paddingVertical: getResponsiveHeight(10),
    paddingHorizontal: getResponsiveWidth(14.5),
    maxWidth: '85%',
    flexShrink: 1,
  },
  receivedText: {
    fontFamily: 'Pretendard-Light',
    fontSize:
      Platform.OS === 'android'
        ? getResponsiveFontSize(14)
        : getResponsiveFontSize(15),
    color: 'black',
    flexWrap: 'wrap',
    lineHeight: getResponsiveFontSize(18),
  },
  receivedTime: {
    fontSize: getResponsiveFontSize(10),
    color: '#666',
    marginLeft: getResponsiveWidth(5),
    lineHeight: getResponsiveFontSize(12),
    marginBottom: getResponsiveHeight(2),
    ...(Platform.OS === 'android' ? {includeFontPadding: false} : null),
  },
  imageGrid: {gap: getResponsiveWidth(4)},
  imageItem: {
    width: getResponsiveWidth(70),
    height: getResponsiveWidth(70),
    borderRadius: 8,
    margin: 2,
  },
  singleImage: {
    width: getResponsiveWidth(200),
    aspectRatio: 1,
    borderRadius: 10,
  },
});
