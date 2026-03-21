/* eslint-disable react-native/no-inline-styles */
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
import { View, TextInput, TouchableOpacity, StyleSheet, Platform, Dimensions, Image, LayoutAnimation, UIManager, Keyboard, ScrollView } from 'react-native';
import {useDispatch} from 'react-redux';
import FastImage from '@d11/react-native-fast-image';
import {Gesture} from 'react-native-gesture-handler';
import RNBlobUtil from 'react-native-blob-util';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {
  Image as ImageCompressor,
  Video as VideoCompressor,
} from 'react-native-compressor';

import {launchImageLibrary} from 'react-native-image-picker';

import {sendChat, isChatSocketOpen} from 'features/chat/hooks/ChatSocket';
import {uploadChatMediaSnapshot} from '../../utils/chatMediaUploadUtils';

import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveFontSize,
} from 'utils/responsive';

import {convertPhUriToFileUri} from 'utils/photoUriConverter';
import {getSelectOrder, isSameAsset, toggleSelectImage} from '../../utils/selection';
import {loadGalleryPhotos} from '../../utils/gallery';
import formatDuration from 'utils/formatDuration';
import ToastModal from 'components/modal/ToastModal';
import {addMessageAndUpdateRoom} from '../../utils/messageActions';

import {hapticLight, hapticSelection, hapticError} from 'utils/haptic';
import ChatMentionDropdown from './ChatMentionDropdown';
import ChatMediaGallery from './ChatMediaGallery';
import AppText from 'components/AppText';
import {
  applyMention,
  extractMentionUserIds,
  findActiveMentionQuery,
} from '../../utils/mentionUtils';
import {
  getExtFromUri,
} from '../../utils/chatInputUtils';

const COLORS = {
  bg: '#F6F7FB',
  surface: '#FFFFFF',
  text: '#111827',
  sub: '#6B7280',
  line: 'rgba(17,24,39,0.08)',
  lineStrong: 'rgba(17,24,39,0.12)',
  chipGlass: 'rgba(17,24,39,0.38)',
  chipGlass2: 'rgba(17,24,39,0.26)',
  plusBg: '#FFFFFF',
};

// 기존 JSX의 <AppText />를 접근성 정책 포함 AppText로 통일하기 위한 별칭
const Text = AppText;

const SCREEN_WIDTH = Dimensions.get('window').width;

const BASE_NUM_COLUMNS = 3;
const PAGE_SIZE = 60;

const GAP = getResponsiveWidth(2);
const PADDING_H = getResponsiveWidth(2);

const ICON_SEND = require('assets/icons/sendBt-dark.png');

const ICON_PLUS = require('assets/icons/tabs/2/camera.png');

const INPUT_H = getResponsiveHeight(45);
const INNER_PAD_V = getResponsiveHeight(10);
const INNER_PAD_H = getResponsiveWidth(14);

// 갤러리 높이(열렸을 때)
const GALLERY_H = getResponsiveHeight(300);

// 입력창 아래 첨부 미리보기 그리드 (6장 초과 시 높이 고정 + 세로 스크롤)
const PREVIEW_COLS = 3;
const PREVIEW_GAP = getResponsiveWidth(6);
const PREVIEW_SCROLL_THRESHOLD = 6;

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// mention / upload helpers were moved to src/features/chat/utils

const ChatInput = forwardRef(function ChatInput(
  {
    chatRoom,
    userId,
    enableMediaPicker = true,
    mentionUsers: mentionUsersProp = [],
  },
  ref,
) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const makeClientId = useCallback(
    () => `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    [],
  );

  const sendingLockRef = useRef(false);

 // ====== state ======
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const [showGallery, setShowGallery] = useState(false); // (선택) 롱프레스에서만 열리게 유지
  const [photos, setPhotos] = useState([]);
  const [endCursor, setEndCursor] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [selectedImages, setSelectedImages] = useState([]);
  const [gridColumns, setGridColumns] = useState(BASE_NUM_COLUMNS);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

 // mention state
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef(null);

 // 커서 안정화용
  const cursorRef = useRef(0);
  useEffect(() => {
    cursorRef.current = cursor;
  }, [cursor]);

 // ====== derived ======
  const trimmed = message.trim();
  const hasSelection = selectedImages.length > 0;
  const canSend = !isSending && (trimmed.length > 0 || hasSelection);

  const previewCellSize = useMemo(() => {
    const totalGaps = PREVIEW_GAP * (PREVIEW_COLS - 1);
    return (SCREEN_WIDTH - INNER_PAD_H * 2 - totalGaps) / PREVIEW_COLS;
  }, []);

  const previewScrollMaxHeight = useMemo(() => {
    return 2 * previewCellSize + PREVIEW_GAP;
  }, [previewCellSize]);

  const previewGridHeight = useMemo(() => {
    if (!hasSelection) return 0;
    const n = selectedImages.length;
    const topPad = getResponsiveHeight(8);
    const bottomPad = getResponsiveHeight(4);
    const effectiveRows =
      n > PREVIEW_SCROLL_THRESHOLD ? 2 : Math.ceil(n / PREVIEW_COLS);
    return (
      topPad +
      effectiveRows * previewCellSize +
      Math.max(0, effectiveRows - 1) * PREVIEW_GAP +
      bottomPad
    );
  }, [hasSelection, selectedImages.length, previewCellSize]);

  const imageSize = useMemo(() => {
    const totalGap = GAP * (gridColumns - 1);
    const totalPad = PADDING_H * 2;
    return (SCREEN_WIDTH - totalPad - totalGap) / gridColumns;
  }, [gridColumns]);

 /**
 * 멘션 후보 원본
 */
  const chatUsersRaw = useMemo(() => {
    if (Array.isArray(mentionUsersProp) && mentionUsersProp.length > 0) {
      return mentionUsersProp;
    }
    return chatRoom?.users || chatRoom?.participants || chatRoom?.members || [];
  }, [mentionUsersProp, chatRoom]);

 // 멘션 후보에서 "본인" 제외
  const mentionUsers = useMemo(() => {
    const me = String(userId ?? '');
    return (chatUsersRaw || [])
      .filter(u => u?.userId != null && u?.name)
      .filter(u => String(u.userId) !== me);
  }, [chatUsersRaw, userId]);

  const activeMention = useMemo(
    () => findActiveMentionQuery(message || '', cursor),
    [message, cursor],
  );

  const mentionCandidates = useMemo(() => {
    if (!activeMention) return [];
    const q = (activeMention.query || '').toLowerCase().trim();
    const list = mentionUsers;

    if (!q) return list.slice(0, 6);
    return list
      .filter(u => String(u.name).toLowerCase().includes(q))
      .slice(0, 6);
  }, [activeMention, mentionUsers]);

  const handlePickMention = useCallback(
    user => {
      if (!activeMention) return;

      const {next, nextCursor} = applyMention(
        message || '',
        activeMention.atIndex,
        cursor,
        user.name,
      );

      setMessage(next);

      requestAnimationFrame(() => {
        inputRef.current?.focus?.();
        inputRef.current?.setNativeProps?.({
          selection: {start: nextCursor, end: nextCursor},
        });
        setCursor(nextCursor);
      });
    },
    [activeMention, cursor, message],
  );

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

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub?.remove?.();
      hideSub?.remove?.();
    };
  }, []);

 // ====== gallery load (인앱 그리드용) ======
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
  const handleToggleImage = useCallback(item => {
    hapticSelection();
    setSelectedImages(prev => toggleSelectImage(prev, item));
  }, []);

  const removeSelectedAt = useCallback(index => {
    hapticSelection();
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const attachmentPreviewCells = useMemo(
    () =>
      selectedImages.map((item, index) => (
        <View
          key={`${item.uri}-${index}`}
          style={[
            styles.previewCell,
            {
              width: previewCellSize,
              height: previewCellSize,
              marginRight:
                (index + 1) % PREVIEW_COLS === 0 ? 0 : PREVIEW_GAP,
              marginBottom: PREVIEW_GAP,
            },
          ]}>
          <Image
            source={{uri: item.uri}}
            style={styles.previewImage}
            resizeMode="cover"
          />
          {item.isVideo && (
            <View style={[styles.videoBadge, styles.previewVideoBadge]}>
              <AppText style={styles.videoBadgeText}>
                {formatDuration(item.duration)}
              </AppText>
            </View>
          )}
          <TouchableOpacity
            style={styles.previewRemove}
            onPress={() => removeSelectedAt(index)}
            hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}
            activeOpacity={0.85}
            accessibilityLabel="첨부 삭제">
            <View style={styles.previewRemoveInner}>
              <AppText
                allowFontScaling={false}
                style={styles.previewRemoveText}>
                ×
              </AppText>
            </View>
          </TouchableOpacity>
        </View>
      )),
    [selectedImages, previewCellSize, removeSelectedAt],
  );

 /**
 * 시스템 갤러리 멀티 선택 (이걸 +버튼 탭에 연결할 거야!)
 */
  const pickFromSystemGallery = useCallback(async () => {
    try {
      if (isSending || sendingLockRef.current) return;

      hapticLight();

      const res = await launchImageLibrary({
        mediaType: 'mixed',
        selectionLimit: 0, // 0 = unlimited (라이브러리 정책에 따라 다를 수 있음)
        includeExtra: true,
        quality: 1,
      });

      if (res?.didCancel) return;
      if (res?.errorCode) {
        showToastFn('갤러리를 여는 데 실패했어.');
        return;
      }

      const assets = res?.assets || [];
      if (assets.length === 0) return;

      const normalized = assets
        .map(a => {
          const uri = a?.uri;
          if (!uri) return null;

          const type = String(a?.type || '');
          const isVideo = type.startsWith('video');

          return {
            uri,
            isVideo,
            duration: a?.duration ?? 0,
          };
        })
        .filter(Boolean);

      if (normalized.length === 0) return;

      setSelectedImages(prev => {
        const seen = new Set(prev.map(x => x.uri));
        const next = [...prev];
        for (const n of normalized) {
          if (!seen.has(n.uri)) {
            next.push(n);
            seen.add(n.uri);
          }
        }
        return next;
      });

 // 시스템 갤러리로 뽑았으면 인앱 갤러리는 닫아주기
      setShowGallery(false);
    } catch (e) {
      console.error(e);
      showToastFn('갤러리 선택 중 오류가 발생했어.');
    }
  }, [isSending, showToastFn]);

  const resolveUploadUri = useCallback(async (uri, index, isVideo) => {
    if (!uri) return uri;

    if (Platform.OS === 'ios' && String(uri).startsWith('ph://')) {
      const converted = await convertPhUriToFileUri(uri, index, isVideo);
      return converted || uri;
    }

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
      if (!exists)
        throw new Error(`android content -> file 변환 실패: ${savedPath}`);

      return `file://${savedPath}`;
    }

    return uri;
  }, []);

  const compressUploadUri = useCallback(async (fileUri, isVideo) => {
    if (!fileUri)
      return {
        uri: fileUri,
        ext: getExtFromUri(fileUri) || (isVideo ? 'mp4' : 'jpg'),
      };

    if (isVideo) {
      const compressed = await VideoCompressor.compress(fileUri, {
        compressionMethod: 'auto',
      });

      const ext = getExtFromUri(compressed) || 'mp4';
      return {uri: compressed, ext};
    }

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
      hapticError();
      sendingLockRef.current = false;
      return;
    }

    const roomId = chatRoom?.chatRoomId;
    if (!roomId) {
      hapticError();
      sendingLockRef.current = false;
      return;
    }

    if (!isChatSocketOpen()) {
      showToastFn('연결이 불안정해요. 다시 시도해주세요.');
      hapticError();
      sendingLockRef.current = false;
      return;
    }

    hapticLight();

    const mediaSnapshot = hasMedia ? [...selectedImages] : [];

    const hasVideo = mediaSnapshot.some(f => !!f.isVideo);
    const hasImage = mediaSnapshot.some(f => !f.isVideo);
    if (hasMedia && hasVideo && hasImage) {
      showToastFn('사진이랑 영상은 한 번에 같이 보낼 수 없어요. 따로 보내줘!');
      hapticError();
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
        const mentionUserIds = extractMentionUserIds(text, mentionUsers);

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
              mentionUserIds,
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
          mentionUserIds,
        });

        if (!ok) {
          showToastFn('연결이 불안정해요. 다시 시도해주세요.');
          hapticError();
          return;
        }

        setMessage('');
        setCursor(0);
      }

 // ===== 2) MEDIA =====
      if (!hasMedia) return;

      setShowGallery(false);
      setSelectedImages([]);

      mediaClientMessageId = makeClientId();
      mediaOptimisticId = `client-${mediaClientMessageId}`;

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

      const fileNames = await uploadChatMediaSnapshot({
        mediaSnapshot,
        resolveUploadUri,
        compressUploadUri,
      });

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

      const ok = sendChat({
        messageType: mediaType,
        chatRoomId: roomId,
        senderId: userId,
        imageUrls: fileNames,
        clientMessageId: mediaClientMessageId,
      });

      if (!ok) {
        showToastFn('연결이 불안정해요. 다시 시도해주세요.');
        hapticError();
      }
    } catch (e) {
      console.error(e);
      hapticError();

      if (hasMedia && mediaClientMessageId && mediaOptimisticId) {
        dispatch(
          addMessageAndUpdateRoom({
            chatRoomId: chatRoom?.chatRoomId,
            message: {
              messageId: mediaOptimisticId,
              clientMessageId: mediaClientMessageId,
              chatRoomId: chatRoom?.chatRoomId,
              senderId: userId,
              messageType: 'image',
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
    mentionUsers,
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

  const renderPhoto = useCallback(
    ({item}) => {
      const isSelected = selectedImages.some(f => isSameAsset(f, item));
      const order = getSelectOrder(selectedImages, item);

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
                <AppText style={styles.videoBadgeText}>
                  {formatDuration(item.duration)}
                </AppText>
              </View>
            )}

            {isSelected && <View style={styles.tileSelectedOverlay} />}

            {isSelected && (
              <View style={styles.orderBadge}>
                <AppText style={styles.orderBadgeText}>
                  {order}
                </AppText>
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [selectedImages, handleToggleImage, imageSize],
  );

 /**
 * “육안 간격 일정”을 위한 핵심:
 * - SafeArea 하단 inset을 ChatInput 바닥에만 반영(부모/키보드와 중복 방지)
 * - 멘션 드롭다운은 top/bottom 혼용 금지 → bottom 기준 하나로 고정
 */
  const mentionBottom = useMemo(() => {
    const gap = getResponsiveHeight(8);
    const gallery = showGallery ? GALLERY_H : 0;

 // 입력바(내부 패딩 포함) 전체 높이
    const inputBarH = INNER_PAD_V * 2 + INPUT_H;

 // 드롭다운은 “입력바 위”에 떠야 하므로:
 // 하단 = safe + 갤러리 + 첨부 미리보기 + 입력바 + gap
    return (
      insets.bottom +
      gallery +
      previewGridHeight +
      inputBarH +
      gap
    );
  }, [insets.bottom, showGallery, previewGridHeight]);

  // SafeArea 하단 inset만큼 항상 유지 (포커스 시에도 위치 고정)
  const rootPaddingBottom = useMemo(() => {
    if (Platform.OS === 'ios' && isKeyboardVisible) return 0;
    return Math.max(insets.bottom, getResponsiveHeight(2));
  }, [insets.bottom, isKeyboardVisible]);

  return (
    <View style={[styles.root, {paddingBottom: rootPaddingBottom}]}>
      {/* 멘션 드롭다운 (bottom 기준만 사용) */}
      {!!activeMention && mentionCandidates.length > 0 && (
        <ChatMentionDropdown
          mentionCandidates={mentionCandidates}
          mentionBottom={mentionBottom}
          onPickMention={handlePickMention}
        />
      )}

      <View style={styles.inputColumn}>
        <View style={styles.innerContainer}>
        <View
          style={[
            styles.inputContainer,
            !enableMediaPicker && {paddingLeft: getResponsiveWidth(12)},
          ]}>
          {enableMediaPicker && (
            <TouchableOpacity
              style={styles.inputPlusButton}
              onPress={() => {
 // 여기만 바뀜: “인앱 갤러리 토글” X → “시스템 갤러리 바로 오픈”
                hapticLight();
                Keyboard.dismiss();
                setShowGallery(false);
                pickFromSystemGallery();
              }}
              onLongPress={() => {
 // 필요 없으면 이 블록째로 지워도 됨!
                hapticSelection();
                Keyboard.dismiss();
                setShowGallery(prev => !prev);
              }}
              delayLongPress={220}
              disabled={isSending || sendingLockRef.current}>
              <Image
                source={ICON_PLUS}
                style={[
                  styles.icon,
                  {
                    width: getResponsiveIconSize(17),
                    height: getResponsiveIconSize(17),
                  },
                  (isSending || sendingLockRef.current) && {opacity: 0.4},
                ]}
                tintColor="white"
              />
            </TouchableOpacity>
          )}

          <TextInput
            ref={inputRef}
            style={styles.input}
            value={message}
            onChangeText={t => {
              const prevCursor = cursorRef.current;
              const prevLen = (message || '').length;

              setMessage(t);

              if (prevCursor >= prevLen) {
                setCursor(t.length);
              } else {
                setCursor(c => Math.min(c, t.length));
              }
            }}
            placeholder="@이름 으로 멘션 가능"
            placeholderTextColor="#999"
            returnKeyType="send"
            editable={!isSending && !sendingLockRef.current}
            onFocus={() => {
              if (showGallery) setShowGallery(false);
            }}
            onSelectionChange={e => {
              const next = e?.nativeEvent?.selection?.start ?? 0;
              setCursor(next);
            }}
            onSubmitEditing={() => {
              hapticLight();
              handleSend();
            }}
          />

          {message.length > 0 && !isSending && !sendingLockRef.current && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                hapticSelection();
                setMessage('');
                setCursor(0);
              }}>
              <Image
                source={require('assets/images/clearBt.png')}
                style={styles.clearIcon}
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => {
              hapticLight();
              handleSend();
            }}
            style={[styles.sendButton]}
            disabled={!canSend || sendingLockRef.current}>
            <View style={styles.sendIconWrap}>
              <Image
                source={ICON_SEND}
                style={[
                  styles.sendIcon,
                  canSend ? styles.sendIconActive : styles.sendIconInactive,
                ]}
              />

              {hasSelection && (
                <View style={[styles.sendBadge, !canSend && {opacity: 0.5}]}>
                  <AppText style={styles.sendBadgeText}>
                    {selectedImages.length > 99 ? '99+' : selectedImages.length}
                  </AppText>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
        </View>

        {enableMediaPicker && hasSelection && (
          <View style={styles.previewWrap}>
            {selectedImages.length > PREVIEW_SCROLL_THRESHOLD ? (
              <ScrollView
                style={[styles.previewScroll, {maxHeight: previewScrollMaxHeight}]}
                contentContainerStyle={styles.previewGrid}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                showsVerticalScrollIndicator>
                {attachmentPreviewCells}
              </ScrollView>
            ) : (
              <View style={styles.previewGrid}>{attachmentPreviewCells}</View>
            )}
          </View>
        )}
      </View>

      {/* (선택 유지) 인앱 갤러리: 이제는 롱프레스에서만 열림 */}
      {enableMediaPicker && (
        <ChatMediaGallery
          showGallery={showGallery}
          pinchGesture={pinchGesture}
          photos={photos}
          gridColumns={gridColumns}
          renderPhoto={renderPhoto}
          galleryHeight={GALLERY_H}
          onPickFromSystemGallery={pickFromSystemGallery}
          isPlusDisabled={isSending || sendingLockRef.current}
          onEndReached={handleEndReached}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
          isLoadingMore={isLoadingMore}
        />
      )}

      <ToastModal
        visible={toastVisible}
        onClose={hideToast}
        message={toastMessage}
      />
    </View>
  );
});

export default ChatInput;

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#fff',
    position: 'relative',
  },

  inputColumn: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#ddd',
  },

  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: INNER_PAD_V,
    paddingHorizontal: INNER_PAD_H,
    gap: getResponsiveWidth(8),
    backgroundColor: '#fff',
  },

  previewWrap: {
    paddingTop: getResponsiveHeight(8),
    paddingBottom: getResponsiveHeight(4),
    paddingHorizontal: INNER_PAD_H,
  },

  previewScroll: {
    width: '100%',
  },

  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  previewCell: {
    position: 'relative',
    borderRadius: getResponsiveWidth(8),
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },

  previewImage: {
    width: '100%',
    height: '100%',
  },

  previewVideoBadge: {
    right: getResponsiveWidth(28),
    bottom: getResponsiveWidth(4),
  },

  previewRemove: {
    position: 'absolute',
    top: getResponsiveWidth(4),
    right: getResponsiveWidth(4),
    zIndex: 20,
  },

  previewRemoveInner: {
    width: getResponsiveWidth(22),
    height: getResponsiveWidth(22),
    borderRadius: 999,
    backgroundColor: 'rgba(17,24,39,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },

  previewRemoveText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'Pretendard-SemiBold',
    lineHeight: getResponsiveFontSize(18),
    marginTop: -getResponsiveHeight(1),
    includeFontPadding: false,
  },

  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: INPUT_H,
    borderRadius: getResponsiveWidth(30),
    borderWidth: 1,
    backgroundColor: 'rgba(80, 100, 100, 0.1)',
    borderColor: 'rgba(55, 65, 81,0.45)',
    paddingHorizontal: getResponsiveWidth(8),
  },

  inputPlusButton: {
    marginRight: getResponsiveWidth(5),
    backgroundColor: 'black',
    borderRadius: 999,
    padding: getResponsiveIconSize(6),
    alignItems: 'center',
    justifyContent: 'center',
  },

  input: {
    flex: 1,
    height: '100%',
    fontFamily: 'Pretendard-Regular',
    fontSize: getResponsiveIconSize(15),
    paddingHorizontal: getResponsiveWidth(4),
    textAlignVertical: 'center',
  },

  clearButton: {
    paddingLeft: getResponsiveWidth(4),
    paddingRight: getResponsiveWidth(0),
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.5,
  },
  clearIcon: {
    width: getResponsiveWidth(18),
    height: getResponsiveWidth(18),
  },

  icon: {
    width: getResponsiveIconSize(28),
    height: getResponsiveIconSize(28),
    resizeMode: 'contain',
  },

  sendButton: {
    paddingVertical: getResponsiveWidth(5),
    paddingRight: getResponsiveWidth(3),
    justifyContent: 'center',
    alignSelf: 'center',
    borderRadius: getResponsiveWidth(20),
  },

  sendIconWrap: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },

  sendIcon: {
    width: getResponsiveIconSize(31),
    height: getResponsiveIconSize(31),
    resizeMode: 'contain',
  },
  sendIconActive: {
    opacity: 1,
    transform: [{scale: 0.9}],
  },
  sendIconInactive: {
    opacity: 1,
    transform: [{scale: 0.7}],
    tintColor: '#9CA3AF',
  },

  sendBadge: {
    position: 'absolute',
    bottom: getResponsiveWidth(4),
    right: -getResponsiveWidth(8),
    minWidth: getResponsiveWidth(18),
    height: getResponsiveWidth(18),
    borderRadius: getResponsiveWidth(9),
    backgroundColor: '#FFC84D',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getResponsiveWidth(2),
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  sendBadgeText: {
    color: '#fff',
    fontSize: getResponsiveIconSize(11.5),
    fontFamily: 'Pretendard-SemiBold',
    includeFontPadding: false,
  },

  tile: {
    marginBottom: GAP,
    borderRadius: getResponsiveWidth(1),
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F3F4F6',
  },
  tileImage: {width: '100%', height: '100%'},
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
    top: getResponsiveHeight(7),
    right: getResponsiveWidth(7),
    minWidth: getResponsiveWidth(22),
    height: getResponsiveWidth(22),
    paddingHorizontal: getResponsiveWidth(7),
    borderRadius: 999,
    backgroundColor: COLORS.chipGlass,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.14,
        shadowRadius: 8,
        shadowOffset: {width: 0, height: 4},
      },
      android: {elevation: 2},
    }),
    zIndex: 10,
  },
  orderBadgeText: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFF',
    letterSpacing: -0.2,
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
});
