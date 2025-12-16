// ReceiveKinoChat.jsx
import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
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
import ImageModal from './mediaModal';

import {
  registerTimeLast,
  unregisterTimeLast,
  minuteKey,
  toEpochMs,
} from '../utils/timeRegistry';
import {getSpacingStyle} from '../utils/getSpacingStyle';
import {CHATROOM_STYLE} from 'styles/style';

const AVATAR_W = getResponsiveWidth(35);

export default function ReceiveKinoChat({
  message,
  chatTime,
  messageType = 'text',
  imageUrls = [],
  isGrouped = false,
  isSameSender = false,
  isTyping = false,
  kinoType = 'YELLOW_KINO',
}) {
  const KINO_PROFILE_MAP = {
    YELLOW_KINO: require('../../../assets/images/kino-yellow.png'),
    BLUE_KINO: require('../../../assets/images/kino-blue.png'),
    PINK_KINO: require('../../../assets/images/kino-pink.png'),
  };

  const getKinoProfileSource = kinoType =>
    KINO_PROFILE_MAP[kinoType] ?? KINO_PROFILE_MAP.YELLOW_KINO;
  const kinoProfileSource = getKinoProfileSource(kinoType);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showTime, setShowTime] = useState(false);
  const idRef = useRef(Math.random().toString(36).slice(2));

  const key = chatTime ? `KINO|${minuteKey(chatTime)}` : null;
  const timeMs = chatTime ? toEpochMs(chatTime) : 0;

  // 일반 메시지일 때만 "마지막 메시지만 시간 표시" 레지스트리 등록
  useEffect(() => {
    if (isTyping || !chatTime || !key) return;

    registerTimeLast(key, idRef.current, timeMs, setShowTime);
    return () => unregisterTimeLast(key, idRef.current);
  }, [key, timeMs, isTyping, chatTime]);

  const spacingStyle = getSpacingStyle({isGrouped, isSameSender});

  // ✅ 타이핑 점 애니메이션용 값
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  const handleImagePress = (uri, index) => {
    setSelectedIndex(index);
    setModalVisible(true);
  };

  // ✅ 점 3개 통통 튀는 애니메이션
  useEffect(() => {
    if (!isTyping) return;

    const makeLoop = (anim, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: -4, // 위로 살짝 튐
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0, // 원위치
            duration: 220,
            useNativeDriver: true,
          }),
        ]),
      );

    const a1 = makeLoop(dot1, 0);
    const a2 = makeLoop(dot2, 120);
    const a3 = makeLoop(dot3, 240);

    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [isTyping, dot1, dot2, dot3]);

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

  // ✅ 입력 중 전용 UI (. . . 말풍선)
  if (isTyping) {
    return (
      <View style={[styles.receivedContainer, spacingStyle]}>
        <FastImage
          source={kinoProfileSource}
          style={styles.kinoProfileImage}
          resizeMode={FastImage.resizeMode.contain}
        />

        <View style={styles.textContainer}>
          <Text style={styles.userName}>키노</Text>

          <View style={styles.messageContainer}>
            <View style={[styles.receivedBubble, styles.typingBubble]}>
              <View style={styles.typingRow}>
                <Animated.View
                  style={[styles.typingDot, {transform: [{translateY: dot1}]}]}
                />
                <Animated.View
                  style={[styles.typingDot, {transform: [{translateY: dot2}]}]}
                />
                <Animated.View
                  style={[styles.typingDot, {transform: [{translateY: dot3}]}]}
                />
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // ✅ 평소 메시지 버전
  return (
    <View style={[styles.receivedContainer, spacingStyle]}>
      <FastImage
        source={kinoProfileSource}
        style={styles.kinoProfileImage}
        resizeMode={FastImage.resizeMode.contain}
      />

      <View style={styles.textContainer}>
        {!isGrouped && <Text style={styles.userName}>키노</Text>}

        <View style={styles.messageContainer}>
          {messageType === 'image' ? (
            imageUrls.length === 1 ? (
              <TouchableOpacity
                onPress={() => handleImagePress(imageUrls[0], 0)}>
                <FastImage
                  source={{uri: imageUrls[0]}}
                  style={styles.singleImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ) : (
              renderImages()
            )
          ) : (
            <View style={styles.receivedBubble}>
              <Text style={styles.receivedText}>{message}</Text>
            </View>
          )}

          {showTime && (
            <Text style={styles.receivedTime}>{formatTime(chatTime)}</Text>
          )}
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
  userName: {
    fontFamily: 'Pretendard-Medium',
    fontSize:
      Platform.OS === 'android'
        ? getResponsiveFontSize(14) // 🔽 14 → 12
        : getResponsiveFontSize(15), // 🔽 15 → 13
    color: '#444',
    marginBottom: getResponsiveHeight(7),
  },
  kinoProfileImage: {
    width: AVATAR_W,
    height: getResponsiveHeight(35),
    marginRight: getResponsiveWidth(7),
    bottom: getResponsiveHeight(0),
  },
  avatarSpacer: {
    width: AVATAR_W,
    marginRight: getResponsiveWidth(8),
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
    fontFamily: 'Pretendard-Regular',
    fontSize: CHATROOM_STYLE.KinoMessageFontSize,
    color: 'black',
    flexWrap: 'wrap',
    lineHeight: getResponsiveFontSize(18),
  },
  receivedTime: {
    fontSize: CHATROOM_STYLE.messageTimeFontSize,
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

  // ✅ typing 전용 스타일
  typingBubble: {
    backgroundColor: '#FFC84D',
    paddingHorizontal: getResponsiveWidth(20),
    paddingVertical: getResponsiveHeight(12),
    borderRadius: getResponsiveIconSize(24),
    minHeight: getResponsiveHeight(32),
    justifyContent: 'center',
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    columnGap: getResponsiveWidth(6),
  },
  typingDot: {
    width: getResponsiveWidth(7),
    height: getResponsiveWidth(7),
    borderRadius: 999,
    backgroundColor: '#2A2A2A',
  },
});
