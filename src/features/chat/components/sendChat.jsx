import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
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
import {CHATROOM_STYLE} from 'styles/style';

export default function SendChat({
  chatTime,
  message,
  mediaUrls,
  messageType = 'text',
  style,
  isGrouped = false,
  isSameSender = false,
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // ✅ mediaUrls를 항상 배열로 강제
  const safeMediaUrls = Array.isArray(mediaUrls)
    ? mediaUrls
    : mediaUrls
    ? [mediaUrls]
    : [];

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

  // ✅ 9장 초과 여부 & 그리드에 실제로 보여줄 리스트
  const hasExtra = safeMediaUrls.length > 9;
  const displayMedia = hasExtra
    ? safeMediaUrls.slice(0, 9)
    : safeMediaUrls;

  const renderImages = () => (
    <View style={[styles.sendBubble, styles.imagePadding]}>
      <FlatList
        data={displayMedia}
        keyExtractor={(item, index) => item + index}
        numColumns={3}
        scrollEnabled={false}
        contentContainerStyle={styles.imageGrid}
        renderItem={({item, index}) => {
          const isLastCell =
            hasExtra && index === displayMedia.length - 1;
          const extraCount =
            safeMediaUrls.length - displayMedia.length;

          return (
            <TouchableOpacity
              onPress={() => handleImagePress(item, index)}
              activeOpacity={0.9}>
              <View>
                <FastImage source={{uri: item}} style={styles.imageItem} />
                {/* 🔹 9장 초과일 때 마지막 셀에 +N 오버레이 */}
                {isLastCell && (
                  <View style={styles.moreOverlay}>
                    <Text style={styles.moreOverlayText}>
                      +{extraCount}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );

  return (
    <View style={[styles.sendContainer, spacingStyle, style]}>
      {showTime && <Text style={styles.sendTime}>{formatTime(chatTime)}</Text>}

      {messageType === 'image' ? (
        safeMediaUrls.length === 1 ? (
          <TouchableOpacity
            onPress={() => handleImagePress(safeMediaUrls[0], 0)}
            activeOpacity={0.9}>
            <FastImage
              source={{uri: safeMediaUrls[0]}}
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
        mediaUrls={safeMediaUrls}      // ✅ 항상 배열
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
    fontFamily: 'Pretendard-Regular',
    fontSize: CHATROOM_STYLE.messageFontSize,
    color: 'black',
    flexWrap: 'wrap',
    lineHeight: getResponsiveFontSize(17),
  },
  sendTime: {
    fontSize: CHATROOM_STYLE.messageTimeFontSize,
    color: '#666',
    marginRight: getResponsiveWidth(5),
    marginBottom: getResponsiveHeight(2),
    ...(Platform.OS === 'android' ? {includeFontPadding: false} : null),
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

  // 🔹 +N 오버레이
  moreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  moreOverlayText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'Pretendard-SemiBold',
  },
});
