/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useMemo, useRef, useState, useCallback} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import AppText from 'components/AppText';
import FastImage from '@d11/react-native-fast-image';

import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from 'utils/responsive';
import formatTime from 'utils/formatTime';
import MediaModal from './mediaModal';

import {
  registerTimeLast,
  unregisterTimeLast,
  minuteKey,
  toEpochMs,
} from '../utils/timeRegistry';
import {getSpacingStyle} from '../utils/getSpacingStyle';
import {CHATROOM_STYLE} from 'styles/style';

import {getVideoThumbnail} from 'utils/videoThumbnail';
import {toCdnUrl} from 'utils/mediaUrl';

import MentionText from 'components/mention/MentionText';

export default function SendChat({
  chatTime,
  message,
  mediaUrls,
  messageType = 'text',
  uploadStatus = 'sent', // uploading | sent | failed
  style,
  isGrouped = false,
  isSameSender = false,

  mentionUsers = [],

 // 이 메시지를 안 읽은 사람 수
  unreadCount = 0,
}) {
  // <Text />는 접근성 정책 포함 AppText로 통일
  const Text = AppText;
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

 // 타입 먼저 계산 (useEffect보다 위)
  const normalizedType = useMemo(
    () => String(messageType ?? 'text').toLowerCase(),
    [messageType],
  );
  const isImage = normalizedType === 'image';
  const isVideo = normalizedType === 'video';
  const isMedia = isImage || isVideo;

  const isUploading = uploadStatus === 'uploading';
  const isFailed = uploadStatus === 'failed';

 // 미디어 url 정리도 위에서
  const safeMediaRaw = useMemo(() => {
    if (Array.isArray(mediaUrls)) return mediaUrls.filter(Boolean);
    if (mediaUrls) return [mediaUrls].filter(Boolean);
    return [];
  }, [mediaUrls]);

  const safeMediaUrls = useMemo(() => {
    return safeMediaRaw.map(toCdnUrl).filter(Boolean);
  }, [safeMediaRaw]);

  const hasExtra = safeMediaUrls.length > 9;
  const displayMedia = hasExtra ? safeMediaUrls.slice(0, 9) : safeMediaUrls;

 // 영상 썸네일 맵 (ratio 계산에서 쓰니까 위로)
  const [videoThumbMap, setVideoThumbMap] = useState({});

  useEffect(() => {
    if (!isVideo) return;
    if (!safeMediaUrls.length) return;

    let alive = true;

    (async () => {
      const results = await Promise.all(
        safeMediaUrls.map(async url => {
          try {
            const t = await getVideoThumbnail(url);
            return [url, t?.uri || null];
          } catch {
            return [url, null];
          }
        }),
      );

      if (!alive) return;

      const next = {};
      for (const [url, thumbUri] of results) {
        if (thumbUri) next[url] = thumbUri;
      }

      if (Object.keys(next).length) {
        setVideoThumbMap(prev => ({...prev, ...next}));
      }
    })();

    return () => {
      alive = false;
    };
  }, [isVideo, safeMediaUrls]);

 // 단건(1장) 원본 비율 렌더를 위한 ratio
  const SINGLE_W = getResponsiveWidth(200);
  const SINGLE_MAX_H = getResponsiveWidth(500);
  const [singleRatio, setSingleRatio] = useState(null);

  useEffect(() => {
    if (!isMedia) return;
    if (safeMediaUrls.length !== 1) return;

    const uri = safeMediaUrls[0];
    if (!uri) return;

    let alive = true;

 // uri 바뀔 때 잔상 방지
    setSingleRatio(null);

    if (isImage) {
      Image.getSize(
        uri,
        (w, h) => {
          if (!alive) return;
          if (!w || !h) return;
          setSingleRatio(w / h);
        },
        () => {
          if (!alive) return;
          setSingleRatio(1);
        },
      );
    } else if (isVideo) {
      const thumb = videoThumbMap[uri];

      if (thumb) {
        Image.getSize(
          thumb,
          (w, h) => {
            if (!alive) return;
            if (!w || !h) return;
            setSingleRatio(w / h);
          },
          () => {
            if (!alive) return;
            setSingleRatio(16 / 9);
          },
        );
      } else {
 // 썸네일 늦게 나와도 레이아웃 잡히게
        setSingleRatio(16 / 9);
      }
    }

    return () => {
      alive = false;
    };
  }, [isMedia, isImage, isVideo, safeMediaUrls, videoThumbMap]);

 // 이미지 preload (그리드만)
  useEffect(() => {
    if (!isImage) return;
    if (!displayMedia.length) return;
    FastImage.preload(
      displayMedia.map(uri => ({uri, priority: FastImage.priority.normal})),
    );
  }, [isImage, displayMedia]);

 // 시간 표시 로직
  const [showTime, setShowTime] = useState(false);
  const idRef = useRef(Math.random().toString(36).slice(2));

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

  const spacingStyle = getSpacingStyle({isGrouped, isSameSender});

  const handleMediaPress = useCallback(
    (_, index) => {
      if (isUploading) return;
      setSelectedIndex(index);
      setModalVisible(true);
    },
    [isUploading],
  );

  const renderUploadOverlay = useCallback(
    (radius = 10) => {
      if (!isUploading && !isFailed) return null;

      return (
        <View style={[styles.loadingOverlay, {borderRadius: radius}]}>
          {isUploading ? (
            <>
              <ActivityIndicator color="#fff" />
              <Text style={styles.loadingText}>
                전송 중…
              </Text>
            </>
          ) : (
            <Text style={styles.failText}>
              전송 실패
            </Text>
          )}
        </View>
      );
    },
    [isUploading, isFailed],
  );

  const safeText = useMemo(() => String(message ?? '').trim(), [message]);
  const hasText = safeText.length > 0;

  if (isMedia && safeMediaUrls.length === 0) return null;

  const getThumbSource = useCallback(
    uri => {
      if (isImage) {
        return {
          uri,
          priority: FastImage.priority.normal,
          cache: FastImage.cacheControl.immutable,
        };
      }

      const thumbUri = videoThumbMap[uri];
      if (thumbUri) {
        return {
          uri: thumbUri,
          priority: FastImage.priority.normal,
          cache: FastImage.cacheControl.immutable,
        };
      }

      return null;
    },
    [isImage, videoThumbMap],
  );

  const renderGrid = () => (
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

          const thumbSource = getThumbSource(item);

          return (
            <TouchableOpacity
              onPress={() => handleMediaPress(item, index)}
              activeOpacity={0.9}>
              <View style={styles.thumbWrap}>
                {thumbSource ? (
                  <FastImage
                    fallback={true}
                    source={thumbSource}
                    style={styles.imageItem}
                    resizeMode={FastImage.resizeMode.cover}
                    onError={e =>
                      console.log('❌ SendChat thumb error:', item, e?.nativeEvent)
                    }
                  />
                ) : (
                  <View style={[styles.imageItem, styles.thumbFallback]} />
                )}

                {isVideo && (
                  <View style={styles.playOverlay}>
                    <View style={styles.playTriangle} />
                  </View>
                )}

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

      {renderUploadOverlay(getResponsiveIconSize(20))}
    </View>
  );

 // 단건(1장) 원본 비율 렌더
  const renderSingle = () => {
    const uri = safeMediaUrls[0];
    const thumbSource = getThumbSource(uri);

    const ratio = singleRatio || (isVideo ? 16 / 9 : 1);

    const computedH = SINGLE_W / ratio;
    const finalH = Math.min(computedH, SINGLE_MAX_H);
    const finalRatio = SINGLE_W / finalH;

    return (
      <View style={styles.singleWrapper}>
        <TouchableOpacity
          onPress={() => handleMediaPress(uri, 0)}
          activeOpacity={0.9}>
          <View>
            {thumbSource ? (
              <FastImage
                fallback={true}
                source={thumbSource}
                style={[
                  styles.singleBase,
                  {
                    width: SINGLE_W,
                    height: finalH,
                    aspectRatio: finalRatio,
                    alignSelf: 'flex-end',
                  },
                ]}
                resizeMode={FastImage.resizeMode.contain}
                onError={e =>
                  console.log('❌ SendChat single thumb error:', uri, e?.nativeEvent)
                }
              />
            ) : (
              <View
                style={[
                  styles.singleBase,
                  styles.thumbFallback,
                  {
                    width: SINGLE_W,
                    height: finalH,
                    aspectRatio: finalRatio,
                    alignSelf: 'flex-end',
                  },
                ]}
              />
            )}

            {isVideo && (
              <View style={styles.playOverlaySingle}>
                <View style={styles.playTriangleBig} />
              </View>
            )}
          </View>
        </TouchableOpacity>

        {renderUploadOverlay(10)}
      </View>
    );
  };

  return (
    <View style={[styles.sendContainer, spacingStyle, style]}>
      {(showTime && !!chatTime) || unreadCount > 0 ? (
        <View style={styles.metaLine}>
          {unreadCount > 0 && (
            <Text style={styles.unreadCountText}>
              {unreadCount}
            </Text>
          )}
          {showTime && !!chatTime && (
            <Text style={styles.sendTime}>
              {formatTime(chatTime)}
            </Text>
          )}
        </View>
      ) : null}

      {isMedia ? (
        safeMediaUrls.length === 1 ? (
          renderSingle()
        ) : (
          renderGrid()
        )
      ) : hasText ? (
        <View style={[styles.sendBubble, styles.textPadding]}>
          <MentionText
            text={message}
            users={mentionUsers}
            textStyle={styles.sendText}
            mentionStyle={[styles.sendText, styles.mentionText]}
          />
        </View>
      ) : null}

      <MediaModal
        visible={modalVisible}
        mediaUrls={safeMediaRaw}
        mediaType={normalizedType}
        initialIndex={selectedIndex}
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

  metaLine: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    marginRight: getResponsiveWidth(5),
    marginBottom: getResponsiveHeight(2),
  },
  unreadCountText: {
    fontSize: getResponsiveFontSize(11),
    color: '#FFC84D',
    fontFamily: 'Pretendard-SemiBold',
    ...(Platform.OS === 'android' ? {includeFontPadding: false} : null),
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
    fontFamily: CHATROOM_STYLE().messageFontFamily,
    fontSize: CHATROOM_STYLE().messageFontSize,
    color: 'black',
    lineHeight: getResponsiveFontSize(17),
  },
  mentionText: {
    color: '#FFC84D',
    fontFamily: 'Pretendard-SemiBold',
  },

  sendTime: {
    fontSize: CHATROOM_STYLE().messageTimeFontSize,
    color: '#666',
    ...(Platform.OS === 'android' ? {includeFontPadding: false} : null),
  },

  imageGrid: {gap: getResponsiveWidth(4)},
  thumbWrap: {position: 'relative'},

  imageItem: {
    width: getResponsiveWidth(70),
    height: getResponsiveWidth(70),
    borderRadius: 4,
    margin: 2,
    backgroundColor: '#F3F4F6',
  },
  thumbFallback: {backgroundColor: '#E5E7EB'},

  singleWrapper: {position: 'relative', alignSelf: 'flex-end'},
  singleBase: {
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
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

  playOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: 'rgba(255,255,255,0.95)',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 3,
  },

  playOverlaySingle: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playTriangleBig: {
    width: 0,
    height: 0,
    borderLeftWidth: 22,
    borderTopWidth: 14,
    borderBottomWidth: 14,
    borderLeftColor: 'rgba(255,255,255,0.95)',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 5,
  },
});
