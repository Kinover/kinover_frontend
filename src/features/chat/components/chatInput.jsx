// components/ChatInput.jsx
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useMemo,
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
  LayoutAnimation,
  UIManager,
  Keyboard,
} from 'react-native';
import {useDispatch} from 'react-redux';
import FastImage from '@d11/react-native-fast-image';
import Animated, {SlideInDown, SlideOutDown} from 'react-native-reanimated';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';

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
import ToastModal from '../../../components/ToastModal';

// import {addMessage} from '../store/messageSlice';
import {addMessageAndUpdateRoom} from '../utils/messageActions';

const SCREEN_WIDTH = Dimensions.get('window').width;

const BASE_NUM_COLUMNS = 3;
const PAGE_SIZE = 60;

const GAP = getResponsiveWidth(2);
const PADDING_H = getResponsiveWidth(2);

const ICON_PLUS = 'https://i.postimg.cc/yxdVHRq7/Group-478.png';
const ICON_SEND = 'https://i.postimg.cc/fLWscdRY/Group-477-1.png';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ChatInput = forwardRef(function ChatInput(
  {chatRoom, userId, socketRef, enableMediaPicker = true},
  ref,
) {
  const dispatch = useDispatch();

  const makeClientId = useCallback(
    () => `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    [],
  );

  // ✅ 중복 전송(엔터+버튼/연타) 강제 차단용 락
  const sendingLockRef = useRef(false);

  // ====== state ======
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const [showGallery, setShowGallery] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [endCursor, setEndCursor] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [selectedImages, setSelectedImages] = useState([]);

  // grid
  const [gridColumns, setGridColumns] = useState(BASE_NUM_COLUMNS);

  // drag select
  const [scrollOffset, setScrollOffset] = useState(0);
  const [dragMode, setDragMode] = useState(null); // 'add' | 'remove' | null
  const lastIndexRef = useRef(null);

  // toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const inputRef = useRef(null);

  // ====== derived ======
  const trimmed = message.trim();
  const hasSelection = selectedImages.length > 0;
  const canSend = !isSending && (trimmed.length > 0 || hasSelection);

  const imageSize = useMemo(() => {
    const totalGap = GAP * (gridColumns - 1);
    const totalPad = PADDING_H * 2;
    return (SCREEN_WIDTH - totalPad - totalGap) / gridColumns;
  }, [gridColumns]);

  // ====== imperative handle ======
  useImperativeHandle(ref, () => ({
    closeGallery: () => setShowGallery(false),
    openGallery: () => setShowGallery(true),
    toggleGallery: () => setShowGallery(prev => !prev),
  }));

  // ====== toast ======
  const showToast = useCallback(msg => {
    setToastMessage(msg);
    setToastVisible(true);
  }, []);

  const hideToast = useCallback(() => setToastVisible(false), []);

  // ====== gallery load ======
  const loadPhotos = useCallback(
    async (after = null) => {
      if (!enableMediaPicker) return;

      const res = await loadGalleryPhotos(after, PAGE_SIZE);
      const newPhotos = res?.photos ?? [];
      const nextCursor = res?.endCursor ?? null;
      const nextHasNextPage = !!res?.hasNextPage;

      setPhotos(prev => (after ? [...prev, ...newPhotos] : newPhotos));
      setEndCursor(nextCursor);
      setHasNextPage(nextHasNextPage);
    },
    [enableMediaPicker],
  );

  useEffect(() => {
    if (!enableMediaPicker) return;
    if (!showGallery) return;

    setEndCursor(null);
    setHasNextPage(true);
    setPhotos([]);
    loadPhotos(null);
  }, [showGallery, enableMediaPicker, loadPhotos]);

  const handleEndReached = useCallback(async () => {
    if (!showGallery) return;
    if (isLoadingMore || !hasNextPage || !endCursor) return;

    setIsLoadingMore(true);
    await loadPhotos(endCursor);
    setIsLoadingMore(false);
  }, [showGallery, isLoadingMore, hasNextPage, endCursor, loadPhotos]);

  const onRefresh = useCallback(async () => {
    if (!showGallery) return;

    setIsRefreshing(true);
    await loadPhotos(null);
    setIsRefreshing(false);
  }, [showGallery, loadPhotos]);

  // ====== actions ======
  const toggleGallery = useCallback(() => {
    if (!enableMediaPicker) return;
    Keyboard.dismiss();
    setShowGallery(prev => !prev);
  }, [enableMediaPicker]);

  const handleToggleImage = useCallback(item => {
    setSelectedImages(prev => toggleSelectImage(prev, item));
  }, []);

  const handleSend = useCallback(async () => {
    // ✅ 1) 중복 호출 자체를 ref 락으로 차단
    if (sendingLockRef.current) return;
    sendingLockRef.current = true;

    const text = message.trim();
    if (!text && selectedImages.length === 0) {
      sendingLockRef.current = false;
      return;
    }

    const roomId = chatRoom?.chatRoomId;
    if (!roomId) {
      sendingLockRef.current = false;
      return;
    }

    const socket = socketRef?.current;

    if (!socket || socket.readyState !== 1) {
      showToast('연결이 불안정해요. 다시 시도해주세요.');
      sendingLockRef.current = false;
      return;
    }

    try {
      setIsSending(true);

      // 1) text (✅ optimistic)
      if (text) {
        const clientMessageId = makeClientId();
        const optimisticId = `client-${clientMessageId}`; // ✅ 핵심: optimistic messageId 규칙 고정

        dispatch(
          addMessageAndUpdateRoom({
            chatRoomId: roomId,
            message: {
              messageId: optimisticId,
              clientMessageId,
              chatRoomId: roomId,
              senderId: userId,
              content: text,
              messageType: 'text',
              createdAt: new Date().toISOString(),
              localStatus: 'sending',
            },
          }),
        );

        socket.send(
          JSON.stringify({
            content: text,
            chatRoomId: roomId,
            senderId: userId,
            messageType: 'text',
            clientMessageId,
          }),
        );

        setMessage('');
      }

      if (!enableMediaPicker) return;

      // 2) media (✅ optimistic)
      if (selectedImages.length > 0) {
        const fileNames = selectedImages.map((file, index) =>
          getFileNameWithExtension(file, index),
        );

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

        const clientMessageId = makeClientId();
        const optimisticId = `client-${clientMessageId}`; // ✅ 동일 규칙

        dispatch(
          addMessageAndUpdateRoom({
            chatRoomId: roomId,
            message: {
              messageId: optimisticId,
              clientMessageId,
              chatRoomId: roomId,
              senderId: userId,
              messageType: 'image',
              imageUrls: fileNames,
              createdAt: new Date().toISOString(),
              localStatus: 'sending',
            },
          }),
        );

        socket.send(
          JSON.stringify({
            messageType: 'image',
            chatRoomId: roomId,
            senderId: userId,
            imageUrls: fileNames,
            clientMessageId,
          }),
        );

        setShowGallery(false);
        setSelectedImages([]);
      }
    } catch (e) {
      console.error(e);
      showToast('전송 중 오류가 발생했어요.');
    } finally {
      setIsSending(false);
      sendingLockRef.current = false;
    }
  }, [
    dispatch,
    message,
    selectedImages,
    socketRef,
    showToast,
    chatRoom?.chatRoomId,
    userId,
    enableMediaPicker,
    makeClientId,
  ]);

  // ====== drag select helpers ======
  const updateSelectionByMode = useCallback((item, mode) => {
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
  }, []);

  const handleDragAtLocation = useCallback(
    (x, y, isStart = false) => {
      if (!photos?.length) return;

      const localX = x - PADDING_H;
      if (localX < 0) return;

      const tileWidth = imageSize + GAP;
      const tileHeight = imageSize + GAP;

      const col = Math.floor(localX / tileWidth);
      if (col < 0 || col >= gridColumns) return;

      const row = Math.floor((scrollOffset + y) / tileHeight);
      if (row < 0) return;

      const index = row * gridColumns + col;
      if (index < 0 || index >= photos.length) return;

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
    [
      photos,
      imageSize,
      gridColumns,
      scrollOffset,
      selectedImages,
      dragMode,
      updateSelectionByMode,
    ],
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const {dx, dy} = gestureState;
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

  // ====== pinch gesture ======
  const pinchGesture = useMemo(() => {
    return Gesture.Pinch()
      .runOnJS(true)
      .onEnd(e => {
        const {scale} = e;

        setGridColumns(prev => {
          let next = prev;

          if (scale > 1.07 && prev > 2) next = prev - 1;
          else if (scale < 0.93 && prev < 4) next = prev + 1;

          if (next !== prev) {
            LayoutAnimation.configureNext(
              LayoutAnimation.Presets.easeInEaseOut,
            );
          }
          return next;
        });
      });
  }, []);

  // ====== render items ======
  const renderPhoto = useCallback(
    ({item}) => {
      const isSelected = selectedImages.some(f => f.uri === item.uri);
      const order = getSelectOrder(selectedImages, item.uri);

      return (
        <TouchableOpacity onPress={() => handleToggleImage(item)}>
          <View style={[styles.tile, {width: imageSize, height: imageSize}]}>
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
    },
    [selectedImages, handleToggleImage, imageSize],
  );

  // ====== UI ======
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
              disabled={isSending || sendingLockRef.current}>
              <FastImage
                source={{uri: ICON_PLUS}}
                style={[
                  styles.icon,
                  (isSending || sendingLockRef.current) && {opacity: 0.4},
                ]}
              />
            </TouchableOpacity>
          )}

          <TextInput
            ref={inputRef}
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="메시지를 입력하세요"
            placeholderTextColor="#999"
            returnKeyType="send"
            editable={!isSending && !sendingLockRef.current}
            onFocus={() => {
              if (showGallery) setShowGallery(false);
            }}
            onSubmitEditing={handleSend}
          />

          {message.length > 0 && !isSending && !sendingLockRef.current && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setMessage('')}>
              <FastImage
                source={require('../../../assets/images/clearBt.png')}
                style={styles.clearIcon}
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleSend}
            style={[styles.sendButton, canSend && styles.sendButtonActive]}
            disabled={!canSend || sendingLockRef.current}>
            {hasSelection ? (
              <View
                style={[styles.sendCountBubble, !canSend && {opacity: 0.5}]}>
                <Text style={styles.sendCountText}>
                  {selectedImages.length}
                </Text>
              </View>
            ) : (
              <Image
                source={{uri: ICON_SEND}}
                style={[
                  styles.sendIcon,
                  canSend ? styles.sendIconWhite : styles.sendIconInactive,
                ]}
              />
            )}
          </TouchableOpacity>
        </View>
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
          {...(showGallery ? panResponder.panHandlers : {})}>
          {showGallery && (
            <GestureDetector gesture={pinchGesture}>
              <View style={{flex: 1}}>
                <FlatList
                  data={photos}
                  key={`chat-gallery-${gridColumns}`}
                  keyExtractor={(item, index) => item.uri + index}
                  renderItem={renderPhoto}
                  numColumns={gridColumns}
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
                    isLoadingMore ? <Text style={styles.footer}></Text> : null
                  }
                />

                {photos.length > 0 && (
                  <LinearGradient
                    pointerEvents="none"
                    colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.6)']}
                    style={styles.bottomFade}
                  />
                )}
              </View>
            </GestureDetector>
          )}
        </Animated.View>
      )}

      <ToastModal
        visible={toastVisible}
        onClose={hideToast}
        message={toastMessage}
      />
    </SafeAreaView>
  );
});

export default ChatInput;

const styles = StyleSheet.create({
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsiveHeight(10),
    paddingHorizontal: getResponsiveWidth(14),
    gap: getResponsiveWidth(8),
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#ddd',
  },

  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: getResponsiveHeight(45),
    borderWidth: 1,
    borderColor: '#FFC84D',
    borderRadius: getResponsiveWidth(30),
    backgroundColor: 'rgba(255, 231, 178, 0.2)',
    paddingHorizontal: getResponsiveWidth(8),
  },

  inputPlusButton: {marginRight: getResponsiveWidth(5)},

  input: {
    flex: 1,
    height: '100%',
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveIconSize(15),
    paddingHorizontal: getResponsiveWidth(4),
    textAlignVertical: 'center',
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

  icon: {
    width: getResponsiveIconSize(30),
    height: getResponsiveIconSize(30),
    resizeMode: 'contain',
  },

  sendButton: {
    paddingVertical: getResponsiveWidth(5),
    paddingHorizontal: getResponsiveWidth(5),
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: getResponsiveWidth(20),
  },
  sendButtonActive: {
    backgroundColor: '#FFC84D',
    borderRadius: getResponsiveWidth(20),
  },
  sendIcon: {
    width: getResponsiveIconSize(20),
    height: getResponsiveIconSize(20),
    resizeMode: 'contain',
  },
  sendIconWhite: {
    tintColor: '#FFFFFF',
    opacity: 1,
    transform: [{scale: 0.9}],
  },
  sendIconInactive: {
    tintColor: 'gray',
    opacity: 1,
    transform: [{scale: 0.9}],
  },

  sendCountBubble: {
    minWidth: getResponsiveWidth(18),
    height: getResponsiveWidth(18),
    borderRadius: getResponsiveWidth(10),
    backgroundColor: '#FFC84D',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  sendCountText: {
    color: 'white',
    fontWeight: '600',
    fontSize: getResponsiveIconSize(13),
    includeFontPadding: false,
    textAlignVertical: 'center',
    fontFamily: 'Pretendard-Medium',
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
    paddingHorizontal: PADDING_H,
  },
  columnWrapper: {
    columnGap: GAP,
  },

  tile: {
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
  footer: {
    textAlign: 'center',
    paddingVertical: getResponsiveHeight(4),
    color: '#666',
  },
});
