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
import { getSpacingStyle } from '../utils/getSpacingStyle';


export default function ReceiveChat({
  userProfileImage,
  userName,
  message,
  chatTime,
  style,
  messageType = 'text',
  mediaUrls = [],
  isGrouped = false,     // 같은 사람 + 같은 분
  isSameSender = false,  // 같은 사람
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // --- 마지막만 시간 표시 로직 ---
  const [showTime, setShowTime] = useState(false);
  const idRef = useRef(Math.random().toString(36).slice(2));

  const senderKey = String(userName ?? '').trim(); 
  const key = `${senderKey}|${minuteKey(chatTime)}`;
  const timeMs = toEpochMs(chatTime);

  useEffect(() => {
    registerTimeLast(key, idRef.current, timeMs, setShowTime);
    return () => unregisterTimeLast(key, idRef.current);
  }, [key, timeMs]);
  // -----------------------------

  const handleImagePress = (uri, index) => {
    setSelectedIndex(index);
    setModalVisible(true);
  };

  // === 간격 계산 ===
  const spacingStyle = getSpacingStyle({isGrouped, isSameSender});

  const renderImages = () => (
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
  );

  return (
    <View
      style={[
        styles.receivedContainer,
        spacingStyle,
        style,
      ]}>
      {/* 그룹이면 아바타 숨기고 동일 폭 스페이서 */}
      {isGrouped ? (
        <View style={styles.avatarSpacer} />
      ) : (
        <FastImage
          source={{uri: userProfileImage}}
          style={styles.receivedUserImage}
        />
      )}

      <View style={styles.textContainer}>
        {!isGrouped && <Text style={styles.userName}>{userName}</Text>}

        <View style={styles.messageLine}>
          {messageType === 'image' && mediaUrls.length === 1 ? (
            <TouchableOpacity onPress={() => handleImagePress(mediaUrls[0], 0)}>
              <FastImage
                source={{uri: mediaUrls[0]}}
                style={styles.singleImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : (
            <View
              style={[
                styles.receivedBubble,
                messageType === 'text'
                  ? styles.textPadding
                  : styles.imagePadding,
              ]}>
              {messageType === 'image' ? (
                renderImages()
              ) : (
                <Text style={styles.receivedText}>{message}</Text>
              )}
            </View>
          )}

          {/* ✅ 해당 분 그룹의 '진짜 마지막'일 때만 시간 표시 */}
          {showTime && (
            <Text style={styles.receivedTime}>{formatTime(chatTime)}</Text>
          )}
        </View>
      </View>

      <MediaModal
        visible={modalVisible}
        mediaUrls={mediaUrls}
        initialIndex={selectedIndex}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

/* ===== 스타일 ===== */
const AVATAR_W = getResponsiveWidth(40);

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
    fontSize:
      Platform.OS === 'android'
        ? getResponsiveFontSize(14)
        : getResponsiveFontSize(15),
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
