import React, {useState, useRef, useEffect} from 'react';
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
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Animated, {SlideInDown, SlideOutDown} from 'react-native-reanimated';
import uuid from 'react-native-uuid';

import {getPresignedUrls, uploadImageToS3} from '../../../../api/imageUrlApi';
import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveIconSize,
} from '../../../../utils/responsive';

// ✅ 유틸 import
import {convertPhUriToFileUri} from '../../../../utils/photo/photoUriConverter';
import {
  getSelectOrder,
  toggleSelectImage,
} from '../../../../utils/photo/selection';
import {loadGalleryPhotos} from '../../../../utils/photo/gallery';

// ====== ✅ 격자 계산 상수 ======
const SCREEN_WIDTH = Dimensions.get('window').width;
const NUM_COLUMNS = 3;
const GAP = getResponsiveWidth(2);
const PADDING_H = getResponsiveWidth(2);
const IMAGE_SIZE =
  (SCREEN_WIDTH - PADDING_H * 2 - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
// =================================

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

  // 페이징
  const [endCursor, setEndCursor] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [selectedImages, setSelectedImages] = useState([]);
  const inputRef = useRef(null);

  // ===== 갤러리 불러오기 (유틸 사용)
  const loadPhotos = async (after = null) => {
    if (!enableMediaPicker) return;
    const {photos: newPhotos, endCursor, hasNextPage} = await loadGalleryPhotos(
      after,
      PAGE_SIZE,
    );
    setPhotos(prev => (after ? [...prev, ...newPhotos] : newPhotos));
    setEndCursor(endCursor);
    setHasNextPage(hasNextPage);
  };

  useEffect(() => {
    if (enableMediaPicker && showGallery) {
      setEndCursor(null);
      setHasNextPage(true);
      setPhotos([]);
      loadPhotos(null);
    }
  }, [showGallery, enableMediaPicker]);

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

  // ===== 메시지 전송
  const handleSend = async () => {
    const socket = socketRef?.current;
    if (!socket || socket.readyState !== 1) {
      alert('연결이 불안정해요. 다시 시도해주세요.');
      return;
    }

    if (message.trim()) {
      const newMessage = {
        content: message,
        chatRoomId: chatRoom.chatRoomId,
        senderId: userId,
        messageType: 'text',
      };
      socket.send(JSON.stringify(newMessage));
      console.log('📤 텍스트 전송:', newMessage);
      setMessage('');
    }

    if (!enableMediaPicker) return;

    if (selectedImages.length > 0) {
      try {
        const fileNames = selectedImages.map(() => `${uuid.v4()}.jpg`);
        const presignedUrls = await getPresignedUrls(fileNames);

        for (let i = 0; i < selectedImages.length; i++) {
          let fileUri = selectedImages[i];
          if (Platform.OS === 'ios' && fileUri.startsWith('ph://')) {
            fileUri = await convertPhUriToFileUri(fileUri, i);
            if (!fileUri) continue;
          }
          await uploadImageToS3(presignedUrls[i], fileUri);
        }

        socket.send(
          JSON.stringify({
            messageType: 'IMAGE',
            chatRoomId: chatRoom.chatRoomId,
            senderId: userId,
            imageUrls: fileNames,
          }),
        );
        console.log('🖼️ 여러 이미지 전송됨:', fileNames);
        setShowGallery(false);
        setSelectedImages([]);
      } catch (error) {
        console.error('이미지 전송 실패:', error);
      }
    }
  };

  const toggleGallery = () => {
    if (!enableMediaPicker) return;
    setShowGallery(prev => !prev);
  };

  const handleToggleImage = uri => {
    setSelectedImages(prev => toggleSelectImage(prev, uri));
  };

  const renderPhoto = ({item}) => {
    const isSelected = selectedImages.includes(item.uri);
    const order = getSelectOrder(selectedImages, item.uri);

    return (
      <TouchableOpacity onPress={() => handleToggleImage(item.uri)}>
        <View style={styles.tile}>
          <Image source={{uri: item.uri}} style={styles.tileImage} />
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
              onPress={toggleGallery}>
              <FastImage
                source={{uri: 'https://i.postimg.cc/yxdVHRq7/Group-478.png'}}
                style={styles.icon}
              />
            </TouchableOpacity>
          )}

          <TextInput
            ref={inputRef}
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="메시지를 입력하세요"
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />

          {message.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setMessage('')}>
              <FastImage
                source={require('../../../../assets/images/clearBt.png')}
                style={styles.clearIcon}
              />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
          <FastImage
            source={{uri: 'https://i.postimg.cc/fLWscdRY/Group-477-1.png'}}
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>

      {/* 갤러리 (무한 스크롤 & 당겨서 새로고침) */}
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
              ListFooterComponent={
                isLoadingMore ? <Text style={styles.footer}></Text> : null
              }
            />
          )}
        </Animated.View>
      )}
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
  sendButton: {padding: getResponsiveWidth(4)},
  icon: {
    width: getResponsiveIconSize(24),
    height: getResponsiveIconSize(24),
    resizeMode: 'contain',
  },
  clearButton: {
    paddingHorizontal: getResponsiveWidth(4),
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.5,
  },
  clearIcon: {width: getResponsiveWidth(18), height: getResponsiveWidth(18)},
  galleryContainer: {
    maxHeight: getResponsiveHeight(300),
    backgroundColor: '#fff',
    marginTop: getResponsiveHeight(7),
  },
  galleryContent: {
    paddingTop: GAP,
    paddingBottom: GAP,
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
});
