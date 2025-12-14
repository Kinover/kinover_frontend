import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
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
  uploadStatus = 'sent', // uploading | sent | failed
  style,
  isGrouped = false,
  isSameSender = false,
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // ✅ 타입/상태 정규화
  const normalizedType = useMemo(
    () => String(messageType ?? 'text').toLowerCase(),
    [messageType],
  );
  const isImage = normalizedType === 'image';
  const isUploading = uploadStatus === 'uploading';
  const isFailed = uploadStatus === 'failed';

  // ✅ mediaUrls 항상 배열
  const safeMediaUrls = useMemo(() => {
    if (Array.isArray(mediaUrls)) return mediaUrls;
    if (mediaUrls) return [mediaUrls];
    return [];
  }, [mediaUrls]);

  // ✅ 9장 초과 처리
  const hasExtra = safeMediaUrls.length > 9;
  const displayMedia = hasExtra ? safeMediaUrls.slice(0, 9) : safeMediaUrls;

  // === 시간 그룹 레지스트리 ===
  const [showTime, setShowTime] = useState(false);
  const idRef = useRef(Math.random().toString(36).slice(2));

  // ✅ chatTime 없을 때 안전 처리 (이게 핵심)
  const timeKey = useMemo(() => {
    if (!chatTime) return null;
    return `ME|${minuteKey(chatTime)}`;
  }, [chatTime]);

  const timeMs = useMemo(() => {
    if (!chatTime) return 0;
    return toEpochMs(chatTime);
  }, [chatTime]);

  useEffect(() => {
    if (!timeKey || !chatTime) return;
    registerTimeLast(timeKey, idRef.current, timeMs, setShowTime);
    return () => unregisterTimeLast(timeKey, idRef.current);
  }, [timeKey, timeMs, chatTime]);

  // === 간격 계산 ===
  const spacingStyle = getSpacingStyle({isGrouped, isSameSender});

  const handleImagePress = (uri, index) => {
    if (isUploading) return; // 업로드 중에는 확대 방지
    setSelectedIndex(index);
    setModalVisible(true);
  };

  const renderUploadOverlay = (radius = 10) => {
    if (!isUploading && !isFailed) return null;

    return (
      <View style={[styles.loadingOverlay, {borderRadius: radius}]}>
        {isUploading ? (
          <>
            <ActivityIndicator color="#fff" />
            <Text style={styles.loadingText}>전송 중…</Text>
          </>
        ) : (
          <Text style={styles.failText}>전송 실패</Text>
        )}
      </View>
    );
  };

  const renderImages = () => (
    <View style={[styles.sendBubble, styles.imagePadding]}>
      <FlatList
        data={displayMedia}
        keyExtractor={(item, index) => String(item) + index}
        numColumns={3}
        scrollEnabled={false}
        contentContainerStyle={styles.imageGrid}
        renderItem={({item, index}) => {
          const isLastCell = hasExtra && index === displayMedia.length - 1;
          const extraCount = safeMediaUrls.length - displayMedia.length;

          return (
            <TouchableOpacity
              onPress={() => handleImagePress(item, index)}
              activeOpacity={0.9}>
              <View>
                <FastImage source={{uri: item}} style={styles.imageItem} />
                {isLastCell && (
                  <View style={styles.moreOverlay}>
                    <Text style={styles.moreOverlayText}>+{extraCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* ✅ 그리드는 모서리 20에 맞춰 오버레이도 20 */}
      {renderUploadOverlay(getResponsiveIconSize(20))}
    </View>
  );

  return (
    <View style={[styles.sendContainer, spacingStyle, style]}>
      {showTime && !!chatTime && (
        <Text style={styles.sendTime}>{formatTime(chatTime)}</Text>
      )}

      {isImage ? (
        safeMediaUrls.length === 1 ? (
          <View style={styles.singleWrapper}>
            <TouchableOpacity
              onPress={() => handleImagePress(safeMediaUrls[0], 0)}
              activeOpacity={0.9}>
              <FastImage
                source={{uri: safeMediaUrls[0]}}
                style={styles.singleImage}
                resizeMode="cover"
              />
            </TouchableOpacity>

            {/* ✅ 단일 이미지는 radius 10 */}
            {renderUploadOverlay(10)}
          </View>
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
        mediaUrls={safeMediaUrls}
        mediaType={normalizedType}
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

  singleWrapper: {
    position: 'relative',
    alignSelf: 'flex-end',
  },
  singleImage: {
    width: getResponsiveWidth(200),
    aspectRatio: 1,
    borderRadius: 10,
    alignSelf: 'flex-end',
  },

  moreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  moreOverlayText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'Pretendard-SemiBold',
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 6,
    color: '#fff',
    fontFamily: 'Pretendard-Medium',
    fontSize: getResponsiveFontSize(12),
  },
  failText: {
    color: '#fff',
    fontFamily: 'Pretendard-SemiBold',
    fontSize: getResponsiveFontSize(13),
  },
});
