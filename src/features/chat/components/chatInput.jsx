import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Platform,
  Dimensions,
  SafeAreaView,
  Text,
  Image,
  PanResponder,
} from 'react-native';
import FastImage from '@d11/react-native-fast-image';
// eslint-disable-next-line import/named
import Animated, {SlideInDown, SlideOutDown} from 'react-native-reanimated';
import {getPresignedUrls, uploadFileToS3} from '../../../api/imageUrlApi';
import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveIconSize,
} from '../../../utils/responsive';

import {convertPhUriToFileUri} from '../../../utils/photoUriConverter';
import {getSelectOrder, toggleSelectImage} from '../../../utils/selection';
import {
  getFileNameWithExtension,
  loadGalleryPhotos,
} from '../../../utils/gallery';
import formatDuration from '../../../utils/formatDuration';
import LinearGradient from 'react-native-linear-gradient';
import ToastModal from '../../../components/ToastModal';

const SCREEN_WIDTH = Dimensions.get('window').width;
const NUM_COLUMNS = 3;
const GAP = getResponsiveWidth(2);
const PADDING_H = getResponsiveWidth(2);
const IMAGE_SIZE =
  (SCREEN_WIDTH - PADDING_H * 2 - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

const PAGE_SIZE = 60;

export default function ChatInput({
  chatRoom,
  userId,
  socketRef,
  enableMediaPicker = true,
}) {
  const [message, setMessage] = useState('');
  const [showGallery, setShowGallery] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [endCursor, setEndCursor] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);

  // ✅ 전송 중 여부
  const [isSending, setIsSending] = useState(false);

  const inputRef = useRef(null);

  // ✅ 드래그 선택용
  const [scrollOffset, setScrollOffset] = useState(0);
  const [dragMode, setDragMode] = useState(null); // 'add' | 'remove' | null
  const lastIndexRef = useRef(null);

  // ✅ 토스트 상태
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = useCallback(msg => {
    setToastMessage(msg);
    setToastVisible(true);
  }, []);

  const hideToast = useCallback(() => {
    setToastVisible(false);
  }, []);

  const loadPhotos = useCallback(
    async (after = null) => {
      if (!enableMediaPicker) return;
      const {
        photos: newPhotos,
        endCursor: nextCursor,
        hasNextPage: nextHasNextPage,
      } = await loadGalleryPhotos(after, PAGE_SIZE);

      setPhotos(prev => (after ? [...prev, ...newPhotos] : newPhotos));
      setEndCursor(nextCursor);
      setHasNextPage(nextHasNextPage);
    },
    [enableMediaPicker],
  );

  useEffect(() => {
    if (enableMediaPicker && showGallery) {
      setEndCursor(null);
      setHasNextPage(true);
      setPhotos([]);
      loadPhotos(null);
    }
  }, [showGallery, enableMediaPicker, loadPhotos]);

  const handleEndReached = async () => {
    if (!showGallery) return;
    if (isLoadingMore || !hasNextPage || !endCursor) return;
    setIsLoadingMore(true);
    await loadPhotos(endCursor);
    setIsLoadingMore(false);
  };

  const onRefresh = async () => {
    if (!showGallery) return;
    setIsRefreshing(true);
    await loadPhotos(null);
    setIsRefreshing(false);
  };

  const handleSend = async () => {
    // ✅ 이미 전송 중이면 무시
    if (isSending) return;

    const trimmed = message.trim();

    // ✅ 보낼 게 아무것도 없으면 리턴
    if (!trimmed && selectedImages.length === 0) {
      return;
    }

    const socket = socketRef?.current;
    console.log('💬 socket 상태:', {
      hasSocket: !!socket,
      readyState: socket?.readyState,
    });

    if (!socket || socket.readyState !== 1) {
      showToast('연결이 불안정해요. 다시 시도해주세요.');
      return;
    }

    try {
      setIsSending(true);

      // 🔹 텍스트 전송
      if (trimmed) {
        const newMessage = {
          content: trimmed,
          chatRoomId: chatRoom.chatRoomId,
          senderId: userId,
          messageType: 'text',
        };
        socket.send(JSON.stringify(newMessage));
        console.log('📤 텍스트 전송:', newMessage);
        setMessage('');
      }

      if (!enableMediaPicker) return;

      // 🔹 이미지/영상 전송
      if (selectedImages.length > 0) {
        try {
          const fileNames = selectedImages.map((file, index) =>
            getFileNameWithExtension(file, index),
          );
          console.log('📂 요청 fileNames:', fileNames);

          const presignedUrls = await getPresignedUrls(fileNames);

          for (let i = 0; i < selectedImages.length; i++) {
            let fileUri = selectedImages[i].uri;
            if (Platform.OS === 'ios' && fileUri.startsWith('ph://')) {
              fileUri = await convertPhUriToFileUri(
                fileUri,
                i,
                selectedImages[i].isVideo,
              );
              if (!fileUri) continue;
            }
            await uploadFileToS3(presignedUrls[i], fileUri, fileNames[i]);
          }

          socket.send(
            JSON.stringify({
              messageType: 'IMAGE',
              chatRoomId: chatRoom.chatRoomId,
              senderId: userId,
              imageUrls: fileNames,
            }),
          );
          console.log('🖼️ 여러 이미지/영상 전송됨:', fileNames);
          setShowGallery(false);
          setSelectedImages([]);
        } catch (error) {
          console.error('이미지 전송 실패:', error);
          showToast('이미지 전송 중 오류가 발생했어요.');
        }
      }
    } finally {
      // ✅ 성공/실패 관계 없이 전송 플래그 해제
      setIsSending(false);
    }
  };

  const toggleGallery = () => {
    if (!enableMediaPicker) return;
    setShowGallery(prev => !prev);
  };

  const handleToggleImage = item => {
    setSelectedImages(prev => toggleSelectImage(prev, item));
  };

  // ✅ 드래그 모드에 따라 선택/해제 업데이트
  const updateSelectionByMode = useCallback(
    (item, mode) => {
      if (!item) return;
      setSelectedImages(prev => {
        const exists = prev.some(f => f.uri === item.uri);
        if (mode === 'add') {
          if (exists) return prev;
          return [...prev, item];
        }
        if (mode === 'remove') {
          if (!exists) return prev;
          return prev.filter(f => f.uri !== item.uri);
        }
        return prev;
      });
    },
    [],
  );

  // ✅ 드래그 위치(x, y)에서 어떤 셀인지 계산해서 선택/해제
  const handleDragAtLocation = useCallback(
    (x, y, isStart = false) => {
      if (!photos || photos.length === 0) return;

      // 갤러리 content 의 좌우 padding 보정
      const localX = x - PADDING_H;
      if (localX < 0) return;

      const tileWidth = IMAGE_SIZE + GAP;
      const tileHeight = IMAGE_SIZE + GAP;

      const col = Math.floor(localX / tileWidth);
      if (col < 0 || col >= NUM_COLUMNS) return;

      const row = Math.floor((scrollOffset + y) / tileHeight);
      if (row < 0) return;

      const index = row * NUM_COLUMNS + col;
      if (index < 0 || index >= photos.length) return;

      // 같은 칸이면 또 처리 안 함
      if (!isStart && lastIndexRef.current === index) return;

      const item = photos[index];

      if (isStart) {
        const already = selectedImages.some(f => f.uri === item.uri);
        const mode = already ? 'remove' : 'add';
        setDragMode(mode);
        updateSelectionByMode(item, mode);
      } else {
        if (!dragMode) return;
        updateSelectionByMode(item, dragMode);
      }

      lastIndexRef.current = index;
    },
    [photos, scrollOffset, selectedImages, dragMode, updateSelectionByMode],
  );

  // ✅ 갤러리 영역에서 가로로 쓸면 드래그 선택
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const {dx, dy} = gestureState;
        // 가로 이동이 충분히 크고, 세로보다 우세할 때만 가로 드래그로 인식
        return Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy);
      },
      onPanResponderGrant: evt => {
        const {locationX, locationY} = evt.nativeEvent;
        handleDragAtLocation(locationX, locationY, true);
      },
      onPanResponderMove: evt => {
        const {locationX, locationY} = evt.nativeEvent;
        handleDragAtLocation(locationX, locationY, false);
      },
      onPanResponderRelease: () => {
        setDragMode(null);
        lastIndexRef.current = null;
      },
      onPanResponderTerminate: () => {
        setDragMode(null);
        lastIndexRef.current = null;
      },
    }),
  ).current;

  const renderPhoto = ({item}) => {
    const isSelected = selectedImages.some(f => f.uri === item.uri);
    const order = getSelectOrder(selectedImages, item.uri);

    return (
      <TouchableOpacity onPress={() => handleToggleImage(item)}>
        <View style={styles.tile}>
          <Image source={{uri: item.uri}} style={styles.tileImage} />
          {item.isVideo && (
            <View style={styles.videoBadge}>
              <Text style={styles.videoBadgeText}>
                {formatDuration(item.duration)}
              </Text>
            </View>
          )}
          {isSelected && <View style={styles.tileSelectedOverlay} />}
          {isSelected && (
            <View style={styles.orderBadge}>
              <Text style={styles.orderBadgeText}>{order}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const hasSelection = selectedImages.length > 0;

  return (
    <SafeAreaView>
      <View style={styles.innerContainer}>
        <View
          style={[
            styles.inputContainer,
            !enableMediaPicker && {paddingLeft: getResponsiveWidth(12)},
          ]}>
          {enableMediaPicker && (
            <TouchableOpacity
              style={styles.inputPlusButton}
              onPress={toggleGallery}
              disabled={isSending} // ✅ 전송 중이면 갤러리 토글 막기(선택 꼬임 방지용)
            >
              <FastImage
                source={{uri: 'https://i.postimg.cc/yxdVHRq7/Group-478.png'}}
                style={[
                  styles.icon,
                  isSending && {opacity: 0.4},
                ]}
              />
            </TouchableOpacity>
          )}

          <TextInput
            ref={inputRef}
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholderTextColor="#999"
            placeholder="메시지를 입력하세요"
            returnKeyType="send"
            editable={!isSending} // ✅ 전송 중이면 입력 잠깐 막기(선택사항)
            onSubmitEditing={() => {
              if (!isSending) handleSend();
            }}
          />

          {message.length > 0 && !isSending && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setMessage('')}>
              <FastImage
                source={require('../../../assets/images/clearBt.png')}
                style={styles.clearIcon}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* ✅ 전송 버튼: 선택한 이미지가 있으면 개수 표시 */}
        <TouchableOpacity
          onPress={handleSend}
          style={styles.sendButton}
          disabled={isSending}
        >
          {hasSelection ? (
            <View
              style={[
                styles.sendCountBubble,
                isSending && {opacity: 0.5},
              ]}>
              <Text style={styles.sendCountText}>{selectedImages.length}</Text>
            </View>
          ) : (
            <FastImage
              source={{uri: 'https://i.postimg.cc/fLWscdRY/Group-477-1.png'}}
              style={[
                styles.icon,
                isSending && {opacity: 0.5},
              ]}
            />
          )}
        </TouchableOpacity>
      </View>

      {enableMediaPicker && (
        <Animated.View
          key={showGallery ? 'open' : 'close'}
          entering={showGallery ? SlideInDown.duration(150) : undefined}
          exiting={SlideOutDown.duration(50)}
          style={[
            styles.galleryContainer,
            {height: showGallery ? getResponsiveHeight(300) : 0},
          ]}
          // ✅ 갤러리 열려 있을 때만 드래그 선택 활성화
          {...(showGallery ? panResponder.panHandlers : {})}>
          {showGallery && (
            <>
              <FlatList
                data={photos}
                keyExtractor={(item, index) => item.uri + index}
                renderItem={renderPhoto}
                numColumns={NUM_COLUMNS}
                contentContainerStyle={styles.galleryContent}
                columnWrapperStyle={styles.columnWrapper}
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.2}
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                onScroll={e =>
                  setScrollOffset(e.nativeEvent.contentOffset?.y ?? 0)
                }
                scrollEventThrottle={16}
                ListFooterComponent={
                  isLoadingMore ? (
                    <Text style={styles.footer}></Text>
                  ) : null
                }
              />
              {photos.length > 0 && (
                <LinearGradient
                  pointerEvents="none"
                  colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.6)']}
                  style={styles.bottomFade}
                />
              )}
            </>
          )}
        </Animated.View>
      )}

      {/* ✅ 토스트 모달 */}
      <ToastModal
        visible={toastVisible}
        onClose={hideToast}
        message={toastMessage}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsiveHeight(10),
    paddingHorizontal: getResponsiveWidth(14),
    gap: getResponsiveWidth(12),
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height:
      Platform.OS === 'android'
        ? getResponsiveHeight(45)
        : getResponsiveHeight(42),
    borderWidth: 1,
    borderColor: '#FFC84D',
    borderRadius: getResponsiveWidth(30),
    backgroundColor: 'rgba(255, 231, 178, 0.2)',
    paddingHorizontal: getResponsiveWidth(10),
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveIconSize(15),
    paddingHorizontal: getResponsiveWidth(4),
    textAlignVertical: 'center',
  },
  inputPlusButton: {marginRight: getResponsiveWidth(6)},
  sendButton: {
    padding: getResponsiveWidth(4),
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: getResponsiveIconSize(24),
    height: getResponsiveIconSize(24),
    resizeMode: 'contain',
  },
  // ✅ 선택된 이미지 개수 뱃지 스타일
  sendCountBubble: {
    minWidth: getResponsiveWidth(24),
    height: getResponsiveWidth(24),
    borderRadius: getResponsiveWidth(13),
    backgroundColor: '#FFC84D',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getResponsiveWidth(6),
  },
  sendCountText: {
    color: 'white',
    fontWeight: '600',
    fontSize: getResponsiveIconSize(15),
    includeFontPadding: false,
    textAlignVertical: 'center',
    fontFamily: 'Pretendard-Medium',
  },
  clearButton: {
    paddingHorizontal: getResponsiveWidth(4),
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.5,
  },
  clearIcon: {
    width: getResponsiveWidth(18),
    height: getResponsiveWidth(18),
  },
  galleryContainer: {
    maxHeight: getResponsiveHeight(300),
    backgroundColor: '#fff',
    marginTop: getResponsiveHeight(7),
    alignItems: 'center',
  },
  galleryContent: {
    paddingTop: GAP,
    paddingBottom: GAP,
    paddingHorizontal: PADDING_H, // ← 좌우 패딩(드래그 계산에도 사용)
  },
  columnWrapper: {
    columnGap: GAP,
  },
  tile: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    marginBottom: GAP,
    borderRadius: getResponsiveWidth(1),
    overflow: 'hidden',
    position: 'relative',
  },
  tileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  tileSelectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: '#FFC84D',
    borderRadius: getResponsiveWidth(1),
    zIndex: 1,
    backgroundColor: 'rgba(128, 128, 128, 0.6)',
  },
  orderBadge: {
    position: 'absolute',
    top: getResponsiveWidth(8),
    right: getResponsiveWidth(8),
    width: getResponsiveWidth(22),
    height: getResponsiveWidth(22),
    borderRadius: getResponsiveWidth(11),
    borderColor: '#FFC84D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    backgroundColor: '#fff',
    zIndex: 2,
  },
  orderBadgeText: {
    color: '#FFC84D',
    fontSize: getResponsiveIconSize(16),
    fontWeight: '700',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  footer: {
    textAlign: 'center',
    paddingVertical: getResponsiveHeight(4),
    color: '#666',
  },
  videoBadge: {
    position: 'absolute',
    bottom: getResponsiveWidth(6),
    right: getResponsiveWidth(6),
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 2,
  },
  videoBadgeText: {
    color: '#fff',
    fontSize: getResponsiveIconSize(12),
    fontWeight: '600',
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -1,
    height: getResponsiveHeight(30),
  },
});
