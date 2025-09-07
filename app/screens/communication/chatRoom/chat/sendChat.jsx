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
import {useNavigation, useRoute} from '@react-navigation/native';

export default function SendChat({
  chatTime,
  message,
  imageUrls = [],
  messageType = 'text',
  style,
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const navigation = useNavigation();
  // === 같은 분 그룹의 '마지막만 시간' 로직 (보낸 쪽은 key에 'ME') ===
  const [showTime, setShowTime] = useState(false);
  const idRef = useRef(Math.random().toString(36).slice(2));
  const key = `ME|${minuteKey(chatTime)}`;
  const timeMs = toEpochMs(chatTime);

  useEffect(() => {
    registerTimeLast(key, idRef.current, timeMs, setShowTime);
    return () => unregisterTimeLast(key, idRef.current);
  }, [key, timeMs]);
  // =========================================================

  const handleImagePress = (uri, index) => {
    setSelectedIndex(index);
    setModalVisible(true);
  };

  const renderImages = () => {
    if (imageUrls.length === 1) {
      return (
        <TouchableOpacity onPress={() => handleImagePress(imageUrls[0])}>
          <FastImage
            source={{uri: imageUrls[0]}}
            style={styles.singleImage}
            resizeMode="cover"
          />
          {/* ✅ 우하단 글쓰기 버튼 */}
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={async () => {
              const convertedUris = [];

              for (let i = 0; i < imageUrls.length; i++) {
                const uri = imageUrls[i];
                if (Platform.OS === 'ios' && uri.startsWith('ph://')) {
                  const converted = await convertPhUriToFileUri(uri, i);
                  if (converted) convertedUris.push(converted);
                } else if (
                  Platform.OS === 'android' &&
                  uri.startsWith('content://')
                ) {
                  const converted = await convertContentUriToFileUri(uri, i);
                  if (converted) convertedUris.push(converted);
                } else {
                  convertedUris.push(uri);
                }
              }

              navigation.navigate('추억', {
                screen: '카테고리선택화면',
                params: {selectedImages: convertedUris, from: '소통'},
              });
            }}>
            <FastImage
              source={require('../../../../assets/icons/writeBt1.png')}
              style={styles.floatingIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </TouchableOpacity>
      );
    }

    const convertPhUriToFileUri = async (phUri, index) => {
      const destPath = `${
        RNFS.TemporaryDirectoryPath
      }photo_ios_${Date.now()}_${index}.jpg`;
      try {
        await RNFS.copyAssetsFileIOS(phUri, destPath, 0, 0);
        return 'file://' + destPath;
      } catch (err) {
        console.error('📛 iOS ph:// 변환 실패:', err.message);
        return null;
      }
    };

    const convertContentUriToFileUri = async (contentUri, index) => {
      const destPath = `${
        RNFS.TemporaryDirectoryPath
      }photo_android_${Date.now()}_${index}.jpg`;
      try {
        const base64Data = await RNFS.readFile(contentUri, 'base64');
        await RNFS.writeFile(destPath, base64Data, 'base64');
        return 'file://' + destPath;
      } catch (err) {
        console.error('📛 Android content:// 변환 실패:', err.message);
        return null;
      }
    };

    return (
      <View style={[styles.sendBubble, styles.imagePadding]}>
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
        {/* ✅ 우하단 글쓰기 버튼 */}
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={async () => {
            const convertedUris = [];

            for (let i = 0; i < imageUrls.length; i++) {
              const uri = imageUrls[i];
              if (Platform.OS === 'ios' && uri.startsWith('ph://')) {
                const converted = await convertPhUriToFileUri(uri, i);
                if (converted) convertedUris.push(converted);
              } else if (
                Platform.OS === 'android' &&
                uri.startsWith('content://')
              ) {
                const converted = await convertContentUriToFileUri(uri, i);
                if (converted) convertedUris.push(converted);
              } else {
                convertedUris.push(uri);
              }
            }

            navigation.navigate('추억', {
              screen: '카테고리선택화면',
              params: {selectedImages: convertedUris},
            });
          }}>
          <FastImage
            source={require('../../../../assets/icons/writeBt1.png')}
            style={styles.floatingIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.sendContainer, style]}>
      {/* ✅ 같은 분 그룹의 '진짜 마지막'일 때만 시간 */}
      {showTime && <Text style={styles.sendTime}>{formatTime(chatTime)}</Text>}

      {messageType === 'image' ? (
        renderImages()
      ) : (
        <View style={[styles.sendBubble, styles.textPadding]}>
          <Text style={styles.sendText}>{message}</Text>
        </View>
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

/* ===== 전역 레지스트리: 같은 분에서 timeMs 최댓값(동률이면 마지막 등록)만 시간 표시 ===== */
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

/* ===== 스타일 (네가 준 SendChat 스타일 그대로) ===== */
const styles = StyleSheet.create({
  sendContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end', // 👉 오른쪽 정렬
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
    alignSelf: 'flex-end', // 👉 오른쪽 끝에 붙임
  },

  floatingButton: {
    position: 'absolute',
    bottom: getResponsiveHeight(-5),
    right: getResponsiveWidth(-5),
    backgroundColor: 'white', // 필요 시 대비용 배경
    borderRadius: getResponsiveWidth(999),
    padding: 7,
    elevation: 3, // 안드로이드 그림자
    shadowColor: '#000', // iOS 그림자
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  floatingIcon: {
    width: getResponsiveWidth(14),
    height: getResponsiveWidth(14),
    objectFit: 'contain',
    resizeMode: 'contain',
  },
});
