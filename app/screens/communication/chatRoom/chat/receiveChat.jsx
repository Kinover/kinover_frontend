import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../../../utils/responsive';
import formatTime from '../../../../utils/formatTime';
import ImageModal from './imageModal';
import FastImage from 'react-native-fast-image';


export default function ReceiveChat({
  userProfileImage,
  userName,
  message,
  chatTime,
  style,
  messageType = 'text',
  imageUrls = [],
  isGrouped = false, // (아바타/이름/패딩만 영향)
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState('');

  // --- 마지막만 시간 표시 로직 ---
  const [showTime, setShowTime] = useState(false);
  const idRef = useRef(Math.random().toString(36).slice(2));

  const senderKey = String(userName ?? '').trim(); // 필요시 senderId로 교체 가능
  const key = `${senderKey}|${minuteKey(chatTime)}`;
  const timeMs = toEpochMs(chatTime);

  useEffect(() => {
    registerTimeLast(key, idRef.current, timeMs, setShowTime);
    return () => unregisterTimeLast(key, idRef.current);
  }, [key, timeMs]);
  // -----------------------------

  const handleImagePress = uri => {
    setSelectedImageUri(uri);
    setModalVisible(true);
  };

  const renderImages = () => (
    <FlatList
      data={imageUrls}
      keyExtractor={(item, index) => item + index}
      numColumns={3}
      renderItem={({item}) => (
        <TouchableOpacity onPress={() => handleImagePress(item)}>
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
        isGrouped ? styles.groupedSpacing : styles.normalSpacing,
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
          {messageType === 'image' && imageUrls.length === 1 ? (
            <TouchableOpacity onPress={() => handleImagePress(imageUrls[0])}>
              <FastImage
                source={{uri: imageUrls[0]}}
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

      <ImageModal
        visible={modalVisible}
        imageUri={selectedImageUri}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

/* ===== 전역 레지스트리: 같은 분 그룹에서 timeMs 가장 큰(동률이면 마지막 등록) 것만 true ===== */
/* ===== 전역 레지스트리: 같은 분 그룹에서 마지막만 시간 표시 ===== */
const TimeGroup = new Map(); // key -> { entries: Map<id, {timeMs, set, seq, visible}>, seq: number }

function recalcWinner(bucket) {
  let winnerId = null;
  let maxTime = -Infinity;
  let maxSeq = -Infinity;

  // 1) 승자 결정: timeMs 큰 것, 동률이면 seq(등록순) 큰 것
  bucket.entries.forEach((val, id) => {
    if (val.timeMs > maxTime || (val.timeMs === maxTime && val.seq > maxSeq)) {
      winnerId = id;
      maxTime = val.timeMs;
      maxSeq = val.seq;
    }
  });

  // 2) 변경된 항목에만 set 호출
  bucket.entries.forEach((val, id) => {
    const shouldShow = id === winnerId;
    if (val.visible !== shouldShow) {
      val.visible = shouldShow;
      val.set(shouldShow); // ✅ 진짜 바뀔 때만 상태 업데이트
    }
  });
}

function registerTimeLast(key, id, timeMs, setShow) {
  if (!TimeGroup.has(key)) TimeGroup.set(key, {entries: new Map(), seq: 0});
  const bucket = TimeGroup.get(key);

  const prev = bucket.entries.get(id);
  const seq = ++bucket.seq;

  // 동일 id가 다시 등록될 때 값이 같으면 그대로 두고 seq만 갱신
  if (prev) {
    prev.timeMs = Number(timeMs) || 0;
    prev.seq = seq;
    // prev.set/prev.visible은 유지
  } else {
    bucket.entries.set(id, {
      timeMs: Number(timeMs) || 0,
      set: setShow,
      seq,
      visible: undefined, // 아직 미정 → recalcWinner가 최초 반영
    });
  }

  recalcWinner(bucket);
}

function unregisterTimeLast(key, id) {
  const bucket = TimeGroup.get(key);
  if (!bucket) return;
  bucket.entries.delete(id);
  if (bucket.entries.size === 0) {
    TimeGroup.delete(key);
  } else {
    recalcWinner(bucket); // 남은 애들 중에서 승자 재계산
  }
}

/* ===== 유틸 ===== */
function toEpochMs(v) {
  if (v == null) return NaN;
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'number') return v > 1e12 ? v : v * 1000; // 초→ms 보정
  const s = String(v).trim().replace(' ', 'T'); // 'YYYY-MM-DD HH:mm:ss' 지원
  const t = Date.parse(s);
  return Number.isNaN(t) ? NaN : t;
}
function minuteKey(time) {
  const t = toEpochMs(time);
  if (Number.isNaN(t)) return 'invalid';
  const d = new Date(t);
  const pad = n => (n < 10 ? `0${n}` : `${n}`);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

/* ===== 스타일 ===== */
const AVATAR_W = getResponsiveWidth(40);

const styles = StyleSheet.create({
  receivedContainer: {flexDirection: 'row', alignItems: 'flex-start'},
  normalSpacing: {marginTop: getResponsiveHeight(10)},
  groupedSpacing: {marginTop: getResponsiveHeight(2)},

  receivedUserImage: {
    width: AVATAR_W,
    height: AVATAR_W,
    borderRadius: getResponsiveWidth(25),
    backgroundColor: '#ddd',
    marginRight: getResponsiveWidth(8),
  },
  // 세로 높이 없이 가로폭만 유지 → 위아래 공백 X
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
    lineHeight:getResponsiveFontSize(12),
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
