import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
} from 'react-native';
import FastImage from 'react-native-fast-image2';

import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../../utils/responsive';
import formatTime from '../../../utils/formatTime';
import MediaModal from './mediaModal';

import {
  registerTimeLast,
  unregisterTimeLast,
  minuteKey,
  toEpochMs,
} from '../utils/timeRegistry';
import {getSpacingStyle} from '../utils/getSpacingStyle';

export default function SendChat({
  chatTime,
  message,
  mediaUrls = [],
  messageType = 'text',
  style,
  isGrouped = false,
  isSameSender = false,
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // === 시간 그룹 레지스트리 ===
  const [showTime, setShowTime] = useState(false);
  const idRef = useRef(Math.random().toString(36).slice(2));
  const key = `ME|${minuteKey(chatTime)}`;
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
    <View style={[styles.sendBubble, styles.imagePadding]}>
      <FlatList
        data={mediaUrls}
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
    </View>
  );

  return (
    <View style={[styles.sendContainer, spacingStyle, style]}>
      {showTime && <Text style={styles.sendTime}>{formatTime(chatTime)}</Text>}

      {messageType === 'image' ? (
        mediaUrls.length === 1 ? (
          <TouchableOpacity onPress={() => handleImagePress(mediaUrls[0])}>
            <FastImage
              source={{uri: mediaUrls[0]}}
              style={styles.singleImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ) : (
          renderImages()
        )
      ) : (
        <View style={[styles.sendBubble, styles.textPadding]}>
          <Text style={styles.sendText}>{message}</Text>
        </View>
      )}

      <MediaModal
        visible={modalVisible}
        mediaUrls={mediaUrls}
        mediaType={messageType}
        initialIndex={selectedIndex}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

/* ===== 스타일 ===== */
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
    paddingHorizontal: getResponsiveWidth(14.5),
  },
  imagePadding: {
    paddingVertical: getResponsiveHeight(4.5),
    paddingHorizontal: getResponsiveWidth(4.5),
  },
  sendText: {
    fontFamily: 'Pretendard-Light',
    fontSize:
      Platform.OS === 'android'
        ? getResponsiveFontSize(14)
        : getResponsiveFontSize(15),
    color: 'black',
    flexWrap: 'wrap',
    lineHeight: getResponsiveFontSize(18),
  },
  sendTime: {
    fontSize: getResponsiveFontSize(10),
    color: '#666',
    marginRight: getResponsiveWidth(5),
    marginBottom: getResponsiveHeight(2),
    ...(Platform.OS === 'android' ? {includeFontPadding: false} : null),
  },
  imageGrid: {gap: getResponsiveWidth(4)},
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
  videoBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  videoBadgeText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(12),
    fontWeight: '600',
  },
});
