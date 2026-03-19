/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useMemo, useRef, useState, useCallback} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';

import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from 'utils/responsive';
import formatTime from '../utils/formatTime';
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
import AppText from 'components/AppText';

// 기존 JSX의 <Text />를 접근성 정책 포함 AppText로 통일
const Text = AppText;

export default function ReceiveChat({
  userProfileImage,
  userName,
  message,
  chatTime,
  style,
  messageType = 'text',
  mediaUrls = [],
  isGrouped = false,
  isSameSender = false,
  mentionUsers = [],
  unreadCount = 0,
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

 // 타입 먼저 계산 (useEffect보다 위에 있어야 함)
  const normalizedType = useMemo(
    () => String(messageType ?? 'text').toLowerCase(),
    [messageType],
  );
  const isImage = normalizedType === 'image';
  const isVideo = normalizedType === 'video';
  const isMedia = isImage || isVideo;

 // 미디어 url 정리도 먼저 (ratio 계산에서 쓰니까 위로)
  const safeMediaRaw = useMemo(() => {
    if (Array.isArray(mediaUrls)) return mediaUrls.filter(Boolean);
    if (mediaUrls) return [mediaUrls].filter(Boolean);
    return [];
  }, [mediaUrls]);

  const safeMediaUrls = useMemo(() => {
    return safeMediaRaw.map(toCdnUrl).filter(Boolean);
  }, [safeMediaRaw]);

  const profileUrl = useMemo(
    () => toCdnUrl(userProfileImage),
    [userProfileImage],
  );

  const hasExtra = safeMediaUrls.length > 9;
  const displayMedia = hasExtra ? safeMediaUrls.slice(0, 9) : safeMediaUrls;

 // videoThumbMap을 ratio effect보다 먼저 선언해야 함
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

 // 단건 비율 상태
  const SINGLE_W = getResponsiveWidth(200);
  const SINGLE_MAX_H = getResponsiveWidth(500);
  const [singleRatio, setSingleRatio] = useState(null);

 // 단건 비율 계산 (선언 순서 정리 완료)
  useEffect(() => {
    if (!isMedia) return;
    if (safeMediaUrls.length !== 1) return;

    const uri = safeMediaUrls[0];
    if (!uri) return;

    let alive = true;

 // uri 바뀌면 일단 초기화 (레이아웃 점프/잔상 방지)
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
 // 썸네일 아직 없으면 기본값으로 먼저 렌더
        setSingleRatio(16 / 9);
      }
    }

    return () => {
      alive = false;
    };
  }, [isMedia, isImage, isVideo, safeMediaUrls, videoThumbMap]);

 // 시간 표시 로직
  const [showTime, setShowTime] = useState(false);
  const idRef = useRef(Math.random().toString(36).slice(2));

  const senderKey = String(userName ?? '').trim();
  const key = `${senderKey}|${minuteKey(chatTime)}`;
  const timeMs = toEpochMs(chatTime);

  useEffect(() => {
    registerTimeLast(key, idRef.current, timeMs, setShowTime);
    return () => unregisterTimeLast(key, idRef.current);
  }, [key, timeMs]);

 // preload
  useEffect(() => {
    if (!isImage) return;
    if (!displayMedia.length) return;
    FastImage.preload(
      displayMedia.map(uri => ({uri, priority: FastImage.priority.normal})),
    );
  }, [isImage, displayMedia]);

  useEffect(() => {
    if (!profileUrl) return;
    FastImage.preload([{uri: profileUrl, priority: FastImage.priority.low}]);
  }, [profileUrl]);

  const spacingStyle = getSpacingStyle({isGrouped, isSameSender});

  const handleMediaPress = useCallback((_, index) => {
    setSelectedIndex(index);
    setModalVisible(true);
  }, []);

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

  const renderMediaGrid = () => (
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
                    console.log(
                      '❌ ReceiveChat thumb error:',
                      item,
                      e?.nativeEvent,
                    )
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
  );

  const renderSingle = () => {
    const uri = safeMediaUrls[0];
    const thumbSource = getThumbSource(uri);

    const ratio = singleRatio || (isVideo ? 16 / 9 : 1);

    const computedH = SINGLE_W / ratio;
    const finalH = Math.min(computedH, SINGLE_MAX_H);
    const finalRatio = SINGLE_W / finalH;

    return (
      <TouchableOpacity
        onPress={() => handleMediaPress(uri, 0)}
        activeOpacity={0.9}>
        <View style={{position: 'relative'}}>
          {thumbSource ? (
            <FastImage
              fallback={true}
              source={thumbSource}
              style={[
                styles.singleBase,
                {width: SINGLE_W, height: finalH, aspectRatio: finalRatio},
              ]}
              resizeMode={FastImage.resizeMode.contain}
              onError={e =>
                console.log(
                  '❌ ReceiveChat single thumb error:',
                  uri,
                  e?.nativeEvent,
                )
              }
            />
          ) : (
            <View
              style={[
                styles.singleBase,
                styles.thumbFallback,
                {width: SINGLE_W, height: finalH, aspectRatio: finalRatio},
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
    );
  };

  const safeText = useMemo(() => String(message ?? '').trim(), [message]);
  const hasText = safeText.length > 0;

  return (
    <View style={[styles.receivedContainer, spacingStyle, style]}>
      {isGrouped ? (
        <View style={styles.avatarSpacer} />
      ) : (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            if (!profileUrl) return;
            setProfileModalVisible(true);
          }}>
          <FastImage
            fallback={true}
            source={{
              uri: profileUrl,
              priority: FastImage.priority.low,
              cache: FastImage.cacheControl.immutable,
            }}
            style={styles.receivedUserImage}
            onError={e =>
              console.log('❌ profile error:', profileUrl, e?.nativeEvent)
            }
          />
        </TouchableOpacity>
      )}

      <View style={styles.textContainer}>
        {!isGrouped && (
          <Text style={styles.userName}>
            {userName}
          </Text>
        )}

        <View style={styles.messageLine}>
          {isMedia && safeMediaUrls.length === 1 ? (
            renderSingle()
          ) : (
            <View
              style={[
                styles.receivedBubble,
                normalizedType === 'text'
                  ? styles.textPadding
                  : styles.imagePadding,
              ]}>
              {isMedia ? (
                renderMediaGrid()
              ) : hasText ? (
                <MentionText
                  text={message}
                  users={mentionUsers}
                  textStyle={styles.receivedText}
                  mentionStyle={[styles.receivedText, styles.mentionText]}
                />
              ) : null}
            </View>
          )}

          {(showTime || unreadCount > 0) && (
            <View style={styles.metaLine}>
              {unreadCount > 0 && (
                <Text style={styles.unreadCountText}>
                  {unreadCount}
                </Text>
              )}
              {showTime && (
                <Text style={styles.receivedTime}>
                  {formatTime(chatTime)}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>

      <MediaModal
        visible={modalVisible}
        mediaUrls={safeMediaRaw}
        mediaType={normalizedType}
        initialIndex={selectedIndex}
        onClose={() => setModalVisible(false)}
      />

      <MediaModal
        visible={profileModalVisible}
        mediaUrls={userProfileImage ? [userProfileImage] : []}
        mediaType="image"
        initialIndex={0}
        onClose={() => setProfileModalVisible(false)}
      />
    </View>
  );
}

const AVATAR_W = getResponsiveWidth(38);

const styles = StyleSheet.create({
  receivedContainer: {flexDirection: 'row', alignItems: 'flex-start'},

  receivedUserImage: {
    width: AVATAR_W,
    height: AVATAR_W,
    borderRadius: getResponsiveWidth(25),
    backgroundColor: '#ddd',
    marginRight: getResponsiveWidth(8),
  },
  avatarSpacer: {
    width: AVATAR_W,
    marginRight: getResponsiveWidth(10),
  },

  textContainer: {flex: 1, flexDirection: 'column'},

  userName: {
    fontFamily: 'Pretendard-Medium',
    fontSize: CHATROOM_STYLE().messageFontSize,
    color: '#444',
    marginBottom: getResponsiveHeight(7),
  },

  messageLine: {flexDirection: 'row', alignItems: 'flex-end', flexShrink: 1},

  receivedBubble: {
    backgroundColor: '#FFECC3',
    borderRadius: getResponsiveIconSize(20),
    maxWidth: getResponsiveWidth(260),
    flexShrink: 1,
  },

  textPadding: {
    paddingVertical: getResponsiveHeight(10),
    paddingHorizontal: getResponsiveWidth(14.5),
  },
  imagePadding: {
    paddingVertical: getResponsiveHeight(4.5),
    paddingHorizontal: getResponsiveWidth(4.5),
  },

  receivedText: {
    fontFamily: CHATROOM_STYLE().messageFontFamily,
    fontSize: CHATROOM_STYLE().messageFontSize,
    color: 'black',
    flexWrap: 'wrap',
    lineHeight: getResponsiveFontSize(17),
  },

  mentionText: {
    color: '#FFC84D',
    fontFamily: 'Pretendard-SemiBold',
  },

  metaLine: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    marginLeft: getResponsiveWidth(5),
  },
  unreadCountText: {
    fontSize: getResponsiveFontSize(11),
    color: '#FFC84D',
    fontFamily: 'Pretendard-SemiBold',
    ...(Platform.OS === 'android' ? {includeFontPadding: false} : null),
  },

  receivedTime: {
    fontSize: CHATROOM_STYLE().messageTimeFontSize,
    color: '#666',
    lineHeight: getResponsiveFontSize(11),
    ...(Platform.OS === 'android' ? {includeFontPadding: false} : null),
  },

  imageGrid: {gap: getResponsiveWidth(4)},
  thumbWrap: {position: 'relative'},
  imageItem: {
    width: getResponsiveWidth(70),
    height: getResponsiveWidth(70),
    borderRadius: 8,
    margin: 2,
    backgroundColor: '#F3F4F6',
  },
  thumbFallback: {backgroundColor: '#E5E7EB'},

  singleBase: {
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },

  moreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  moreOverlayText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'Pretendard-SemiBold',
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
