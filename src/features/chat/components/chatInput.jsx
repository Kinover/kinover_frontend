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
  LayoutAnimation,
  UIManager,
  Keyboard,
} from 'react-native';
import {useDispatch} from 'react-redux';
import FastImage from '@d11/react-native-fast-image';
import Animated, {SlideInDown, SlideOutDown} from 'react-native-reanimated';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import RNBlobUtil from 'react-native-blob-util';

import {
  Image as ImageCompressor,
  Video as VideoCompressor,
} from 'react-native-compressor';

import {sendChat, isChatSocketOpen} from 'features/chat/hooks/ChatSocket';
import {getPresignedUrls, uploadFileToS3} from '../../../api/imageUrlApi';

import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveIconSize,
} from '../../../utils/responsive';

import {convertPhUriToFileUri} from '../../../utils/photoUriConverter';
import {getSelectOrder, toggleSelectImage} from '../../../utils/selection';
import {loadGalleryPhotos} from '../../../utils/gallery';
import formatDuration from '../../../utils/formatDuration';
import ToastModal from '../../../components/ToastModal';
import {addMessageAndUpdateRoom} from '../utils/messageActions';
import {BUTTON_STYLES} from 'styles/style';

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

// ✅ 파일명 기반 content-type (반드시 모든 케이스 리턴)
const inferContentTypeByName = fileName => {
  const lower = String(fileName || '').toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.mp4')) return 'video/mp4';
  if (lower.endsWith('.mov')) return 'video/quicktime';
  return 'application/octet-stream';
};

// ✅ uri에서 확장자 추정
const getExtFromUri = uri => {
  try {
    const clean = String(uri || '').split('?')[0];
    const ext = clean.split('.').pop()?.toLowerCase();
    if (!ext || ext.includes('/') || ext.length > 6) return null;
    return ext;
  } catch {
    return null;
  }
};

// ✅ file:// 제거한 path
const stripFileScheme = uri =>
  String(uri || '').startsWith('file://')
    ? String(uri).replace('file://', '')
    : String(uri);

const ChatInput = forwardRef(function ChatInput(
  {chatRoom, userId, enableMediaPicker = true},
  ref,
) {
  const dispatch = useDispatch();

  const makeClientId = useCallback(
    () => `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    [],
  );

  // ✅ 중복 전송 락
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
  const showToastFn = useCallback(msg => {
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

  const isVideoItem = useCallback(item => !!item?.isVideo, []);

  // ✅ 업로드 전 uri 정리: iOS(ph://), Android(content://)
  const resolveUploadUri = useCallback(async (uri, index, isVideo) => {
    if (!uri) return uri;

    // iOS: ph:// -> file://
    if (Platform.OS === 'ios' && String(uri).startsWith('ph://')) {
      const converted = await convertPhUriToFileUri(uri, index, isVideo);
      return converted || uri;
    }

    // Android: content:// -> cache file (GET fetch)
    if (Platform.OS === 'android' && String(uri).startsWith('content://')) {
      const ext = isVideo ? 'mp4' : 'jpg';
      const destPath = `${
        RNBlobUtil.fs.dirs.CacheDir
      }/kino_${Date.now()}_${index}.${ext}`;

      const r = await RNBlobUtil.config({
        path: destPath,
        fileCache: true,
      }).fetch('GET', uri);

      const savedPath = r?.path?.() || destPath;

      const exists = await RNBlobUtil.fs.exists(savedPath);
      if (!exists) {
        throw new Error(`android content -> file 변환 실패: ${savedPath}`);
      }

      return `file://${savedPath}`;
    }

    return uri;
  }, []);

  /* =========================
   * ✅ 압축 유틸
   * ========================= */

  const compressUploadUri = useCallback(async (fileUri, isVideo) => {
    if (!fileUri)
      return {
        uri: fileUri,
        ext: getExtFromUri(fileUri) || (isVideo ? 'mp4' : 'jpg'),
      };

    // react-native-compressor는 file://, ph://, content://를 받기도 하지만
    // 너는 이미 resolveUploadUri로 file://로 맞춰줄 거라 안정적임.
    if (isVideo) {
      // ⚠️ 옵션은 버전별로 조금 다를 수 있음
      // 가장 무난: auto/medium 계열
      const compressed = await VideoCompressor.compress(fileUri, {
        compressionMethod: 'auto',
        // 너무 느리면 아래로 바꿔:
        // compressionMethod: 'manual',
        // maxSize: 720, // 지원 버전이면 사용
      });

      const ext = getExtFromUri(compressed) || 'mp4';
      return {uri: compressed, ext};
    }

    // image
    const compressed = await ImageCompressor.compress(fileUri, {
      compressionMethod: 'auto',
      quality: 0.8,
    });

    const ext = getExtFromUri(compressed) || 'jpg';
    return {uri: compressed, ext};
  }, []);

  // ====== send ======
  const handleSend = useCallback(async () => {
    if (sendingLockRef.current) return;
    sendingLockRef.current = true;

    const text = message.trim();
    const hasMedia = enableMediaPicker && selectedImages.length > 0;

    if (!text && !hasMedia) {
      sendingLockRef.current = false;
      return;
    }

    const roomId = chatRoom?.chatRoomId;
    if (!roomId) {
      sendingLockRef.current = false;
      return;
    }

    if (!isChatSocketOpen()) {
      showToastFn('연결이 불안정해요. 다시 시도해주세요.');
      sendingLockRef.current = false;
      return;
    }

    const mediaSnapshot = hasMedia ? [...selectedImages] : [];

    // ✅ 이미지/영상 섞어서 선택 금지
    const hasVideo = mediaSnapshot.some(f => !!f.isVideo);
    const hasImage = mediaSnapshot.some(f => !f.isVideo);
    if (hasMedia && hasVideo && hasImage) {
      showToastFn('사진이랑 영상은 한 번에 같이 보낼 수 없어요. 따로 보내줘!');
      sendingLockRef.current = false;
      return;
    }

    const mediaType = hasVideo ? 'video' : 'image';

    let mediaClientMessageId = null;
    let mediaOptimisticId = null;

    try {
      setIsSending(true);

      // ===== 1) TEXT =====
      if (text) {
        const clientMessageId = makeClientId();
        const optimisticId = `client-${clientMessageId}`;

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

        const ok = sendChat({
          content: text,
          chatRoomId: roomId,
          senderId: userId,
          messageType: 'text',
          clientMessageId,
        });

        if (!ok) {
          showToastFn('연결이 불안정해요. 다시 시도해주세요.');
          return;
        }

        setMessage('');
      }

      // ===== 2) MEDIA =====
      if (!hasMedia) return;

      setShowGallery(false);
      setSelectedImages([]);

      mediaClientMessageId = makeClientId();
      mediaOptimisticId = `client-${mediaClientMessageId}`;

      // ✅ 낙관적 UI (로컬 uri로 미리 보여주기)
      dispatch(
        addMessageAndUpdateRoom({
          chatRoomId: roomId,
          message: {
            messageId: mediaOptimisticId,
            clientMessageId: mediaClientMessageId,
            chatRoomId: roomId,
            senderId: userId,
            messageType: mediaType,
            mediaUrls: mediaSnapshot.map(p => p.uri),
            createdAt: new Date().toISOString(),
            uploadStatus: 'uploading',
            localStatus: 'sending',
          },
        }),
      );

      // ✅ 1) 업로드용 uri 준비(file://) + 2) 압축 + 3) fileName/contentType 결정
      const now = Date.now();
      const prepared = [];

      for (let i = 0; i < mediaSnapshot.length; i++) {
        const original = mediaSnapshot[i];
        const originalUri = original?.uri;

        // file:// 로 통일
        const resolvedUri = await resolveUploadUri(
          originalUri,
          i,
          !!original?.isVideo,
        );

        // 압축
        const {uri: compressedUri, ext} = await compressUploadUri(
          resolvedUri,
          !!original?.isVideo,
        );

        // fileName은 "압축 결과 ext" 기준
        const safeExt = ext || (original?.isVideo ? 'mp4' : 'jpg');
        const fileName = `chat_${now}_${i}.${safeExt}`;
        const contentType = inferContentTypeByName(fileName);

        // 0바이트 방지용 체크(특히 영상)
        const p = stripFileScheme(compressedUri);
        const stat = await RNBlobUtil.fs.stat(p);
        const size = Number(stat?.size || 0);
        if (!size)
          throw new Error(`압축 결과 파일이 비었어요: ${compressedUri}`);

        prepared.push({
          uploadUri: compressedUri,
          fileName,
          contentType,
        });

        console.log('🗜️ compressed meta', {
          i,
          isVideo: !!original?.isVideo,
          resolvedUri,
          compressedUri,
          fileName,
          contentType,
          size,
        });
      }

      // presigned
      const presignedUrls = await getPresignedUrls(
        prepared.map(p => ({fileName: p.fileName, contentType: p.contentType})),
      );

      // upload
      for (let i = 0; i < prepared.length; i++) {
        const presigned =
          typeof presignedUrls[i] === 'string'
            ? presignedUrls[i]
            : presignedUrls[i]?.url;

        if (!presigned) throw new Error('presigned url is missing');

        console.log('🧾 PUT 직전', {
          presigned: String(presigned).split('?')[0],
          contentType: prepared[i].contentType,
          uploadUri: prepared[i].uploadUri,
          fileName: prepared[i].fileName,
        });

        await uploadFileToS3(
          presigned,
          prepared[i].uploadUri,
          prepared[i].contentType,
          prepared[i].fileName,
        );
      }

      const fileNames = prepared.map(p => p.fileName);

      // 업로드 완료로 상태 업데이트
      dispatch(
        addMessageAndUpdateRoom({
          chatRoomId: roomId,
          message: {
            messageId: mediaOptimisticId,
            clientMessageId: mediaClientMessageId,
            chatRoomId: roomId,
            senderId: userId,
            messageType: mediaType,
            imageUrls: fileNames,
            mediaUrls: fileNames,
            createdAt: new Date().toISOString(),
            uploadStatus: 'sent',
            localStatus: 'sending',
          },
        }),
      );

      // 서버/소켓 전송
      const ok = sendChat({
        messageType: mediaType,
        chatRoomId: roomId,
        senderId: userId,
        imageUrls: fileNames,
        clientMessageId: mediaClientMessageId,
      });

      if (!ok) showToastFn('연결이 불안정해요. 다시 시도해주세요.');
    } catch (e) {
      console.error(e);

      if (hasMedia && mediaClientMessageId && mediaOptimisticId) {
        dispatch(
          addMessageAndUpdateRoom({
            chatRoomId: chatRoom?.chatRoomId,
            message: {
              messageId: mediaOptimisticId,
              clientMessageId: mediaClientMessageId,
              chatRoomId: chatRoom?.chatRoomId,
              senderId: userId,
              messageType: mediaType,
              createdAt: new Date().toISOString(),
              uploadStatus: 'failed',
              localStatus: 'failed',
            },
          }),
        );
      }

      showToastFn('전송 중 오류가 발생했어요.');
    } finally {
      setIsSending(false);
      sendingLockRef.current = false;
    }
  }, [
    dispatch,
    message,
    selectedImages,
    showToastFn,
    chatRoom?.chatRoomId,
    userId,
    enableMediaPicker,
    makeClientId,
    resolveUploadUri,
    compressUploadUri,
  ]);

  // ====== pinch gesture (grid columns) ======
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
        <TouchableOpacity
          onPress={() => handleToggleImage(item)}
          activeOpacity={0.9}>
          <View style={[styles.tile, {width: imageSize, height: imageSize}]}>
            <Image
              source={{uri: item.uri}}
              style={styles.tileImage}
              resizeMode={FastImage.resizeMode.cover}
            />

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
          ]}>
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
                  scrollEventThrottle={16}
                  ListFooterComponent={
                    isLoadingMore ? <Text style={styles.footer} /> : null
                  }
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                  removeClippedSubviews={false}
                />

                {/* {photos.length > 0 && (
                  <LinearGradient
                    pointerEvents="none"
                    colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.6)']}
                    style={styles.bottomFade}
                  />
                )} */}
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
    borderRadius: getResponsiveWidth(30),
    borderWidth: 1,
    // borderColor: '#FFC84D',
    // backgroundColor: 'rgba(255, 231, 178, 0.2)',
    backgroundColor: 'rgba(80, 100, 100, 0.1)',
    borderColor: 'rgba(55, 65, 81,0.45)',

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
    backgroundColor: '#F3F4F6',
  },
  tileImage: {
    width: '100%',
    height: '100%',
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
    right: getResponsiveWidth(6),
    bottom: getResponsiveWidth(6),
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: getResponsiveWidth(6),
    paddingVertical: getResponsiveHeight(2),
    borderRadius: getResponsiveWidth(4),
    zIndex: 2,
  },
  videoBadgeText: {
    color: '#fff',
    fontSize: getResponsiveIconSize(11.5),
    fontFamily: 'Pretendard-SemiBold',
    includeFontPadding: false,
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
