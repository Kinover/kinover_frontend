// SendKinoChat.jsx
import React, {useEffect, useRef, useState, useMemo} from 'react';
import { View, StyleSheet, Platform, FlatList } from 'react-native';
import SpringPressable from 'components/SpringPressable';
import AppText from 'components/AppText';
import FastImage from '@d11/react-native-fast-image';
import {useScaledStyleSheet} from 'hooks/useScaledStyleSheet';
import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveIconSize,
} from 'utils/responsive';
import formatTime from '../../utils/formatTime';
import ImageModal from './mediaModal';

import {
  registerTimeLast,
  unregisterTimeLast,
  minuteKey,
  toEpochMs,
} from '../../utils/timeRegistry';
import {getSpacingStyle} from '../../utils/getSpacingStyle';
import {CHATROOM_STYLE} from 'styles/style';
import KinoBubble from '../bubbles/KinoBubble';
import {useColors, useIsDark} from 'hooks/useColors';
import {
  CHAT_OUTGOING_BUBBLE_DARK_BG,
  CHAT_OUTGOING_BUBBLE_DARK_TEXT,
} from '../../utils/chatOutgoingBubbleDark';

// 기존 JSX의 <AppText />를 접근성 정책 포함 AppText로 통일
const Text = AppText;

export default function SendKinoChat({
  chatTime,
  imageUrls = [],
  messageType = 'text',
  message,
  isGrouped = false,
  isSameSender = false,
  kinoType = 'YELLOW_KINO',
}) {
  const colors = useColors();
  const isDark = useIsDark();

  const styles = useScaledStyleSheet(rf => ({

  sendContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  sendBubble: {
    backgroundColor: isDark ? CHAT_OUTGOING_BUBBLE_DARK_BG : '#FFECC3',
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
    fontSize: CHATROOM_STYLE().KinoMessageFontSize,
    color: isDark ? CHAT_OUTGOING_BUBBLE_DARK_TEXT : '#111827',
    flexWrap: 'wrap',
    lineHeight: rf(18),
  },
  sendTime: {
    fontSize: rf(10.5),
    color: colors.textTertiary,
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

  }), [colors, isDark]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

 // === 마지막만 시간 표시 ===
  const [showTime, setShowTime] = useState(false);
  const idRef = useRef(Math.random().toString(36).slice(2));
  const key = `KINO_ME|${minuteKey(chatTime)}`;
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

  const KINO_SEND_LIGHT = useMemo(
    () => ({
      YELLOW_KINO: {bubble: '#FFECC3', text: '#111827'},
      BLUE_KINO: {bubble: '#D7E9FF', text: '#0F172A'},
      PINK_KINO: {bubble: '#FFEAF2', text: '#111827'},
    }),
    [],
  );

  const bubbleColors = useMemo(() => {
    if (isDark) {
      return {
        bubble: CHAT_OUTGOING_BUBBLE_DARK_BG,
        text: CHAT_OUTGOING_BUBBLE_DARK_TEXT,
      };
    }
    return KINO_SEND_LIGHT[kinoType] ?? KINO_SEND_LIGHT.YELLOW_KINO;
  }, [isDark, kinoType, KINO_SEND_LIGHT]);

  const renderImages = () => (
    <KinoBubble
      alignment="right"
      paddingVariant="media"
      backgroundColor={bubbleColors.bubble}>
      <FlatList
        data={imageUrls}
        keyExtractor={(item, index) => item + index}
        numColumns={3}
        renderItem={({item, index}) => (
          <SpringPressable onPress={() => handleImagePress(item, index)}>
            <FastImage         fallback={true}
 source={{uri: item}} style={styles.imageItem} />
          </SpringPressable>
        )}
        scrollEnabled={false}
        contentContainerStyle={styles.imageGrid}
      />
    </KinoBubble>
  );

  return (
    <View style={[styles.sendContainer, spacingStyle]}>
      {showTime && <AppText style={styles.sendTime}>{formatTime(chatTime)}</AppText>}

      {messageType === 'image' ? (
        imageUrls.length === 1 ? (
          <SpringPressable onPress={() => handleImagePress(imageUrls[0], 0)}>
            <FastImage         fallback={true}

              source={{uri: imageUrls[0]}}
              style={styles.singleImage}
              resizeMode="cover"
            />
          </SpringPressable>
        ) : (
          renderImages()
        )
      ) : (
        <KinoBubble
          alignment="right"
          paddingVariant="text"
          backgroundColor={bubbleColors.bubble}>
          <AppText style={[styles.sendText, {color: bubbleColors.text}]}>
            {message}
          </AppText>
        </KinoBubble>
      )}

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
