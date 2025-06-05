// ✅ ChatInput.js
import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  FlatList,
  PermissionsAndroid,
  Platform,
  Dimensions,
} from 'react-native';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';
import uuid from 'react-native-uuid';
import {getPresignedUrls, uploadImageToS3} from '../../../../api/imageUrlApi';
import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveIconSize,
} from '../../../../utils/responsive';
import RNFS from 'react-native-fs';

const SCREEN_WIDTH = Dimensions.get('window').width;
const IMAGE_SIZE = SCREEN_WIDTH / 4 - 4;

export default function ChatInput({chatRoom, user, socketRef}) {
  const [message, setMessage] = useState('');
  const [showGallery, setShowGallery] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const inputRef = useRef(null);

  const requestPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        Platform.Version >= 33
          ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
          : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const loadPhotos = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    try {
      const res = await CameraRoll.getPhotos({first: 30, assetType: 'Photos'});
      const photoData = res.edges.map(edge => edge.node.image);
      setPhotos(photoData);
    } catch (err) {
      console.log('❌ getPhotos 실패:', err);
    }
  };

  useEffect(() => {
    if (showGallery) loadPhotos();
  }, [showGallery]);

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
        senderId: user.userId,
        messageType: 'text',
      };
      socket.send(JSON.stringify(newMessage));
      console.log('📤 텍스트 전송:', newMessage);
      setMessage('');
    }

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
            senderId: user.userId,
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
    setShowGallery(prev => !prev);
  };

  const convertPhUriToFileUri = async (phUri, index) => {
    const destPath = `${
      RNFS.TemporaryDirectoryPath
    }photo_${Date.now()}_${index}.jpg`;
    try {
      await RNFS.copyAssetsFileIOS(phUri, destPath, 0, 0);
      return 'file://' + destPath;
    } catch (err) {
      console.error('📛 ph:// 변환 실패:', err.message);
      return null;
    }
  };

  const toggleSelectImage = uri => {
    if (selectedImages.includes(uri)) {
      setSelectedImages(prev => prev.filter(img => img !== uri));
    } else {
      setSelectedImages(prev => [...prev, uri]);
    }
  };

  const renderPhoto = ({item}) => {
    const isSelected = selectedImages.includes(item.uri);
    return (
      <TouchableOpacity onPress={() => toggleSelectImage(item.uri)}>
        <Image
          source={{uri: item.uri}}
          style={{
            width: IMAGE_SIZE,
            height: IMAGE_SIZE,
            margin: 2,
            borderRadius: 1,
            borderWidth: isSelected ? 3 : 0,
            borderColor: isSelected ? '#FFC84D' : 'transparent',
          }}
        />
      </TouchableOpacity>
    );
  };

  return (
    <>
      <View style={styles.innerContainer}>
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.inputPlusButton}
            onPress={toggleGallery}>
            <Image
              source={{uri: 'https://i.postimg.cc/yxdVHRq7/Group-478.png'}}
              style={{
                width: getResponsiveIconSize(24),
                height: getResponsiveIconSize(24),
              }}
            />
          </TouchableOpacity>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="메시지를 입력하세요"
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
        </View>
        <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
          <Image
            source={{uri: 'https://i.postimg.cc/fLWscdRY/Group-477-1.png'}}
            style={{
              width: getResponsiveWidth(24),
              height: getResponsiveHeight(24),
            }}
          />
        </TouchableOpacity>
      </View>

      {showGallery && (
        <View style={styles.galleryContainer}>
          <FlatList
            data={photos}
            keyExtractor={(item, index) => item.uri + index}
            renderItem={renderPhoto}
            numColumns={4}
            contentContainerStyle={styles.galleryContent}
          />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveHeight(10),
    paddingHorizontal: getResponsiveWidth(14.5),
    gap: getResponsiveWidth(12),
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: getResponsiveHeight(42),
    borderWidth: 1,
    borderColor: '#FFC84D',
    borderRadius: 30,
    backgroundColor: 'rgba(255, 231, 178, 0.2)',
    paddingHorizontal: getResponsiveWidth(7.5),
  },
  input: {
    flex: 1,
    height: '100%',
    alignSelf: 'center',
    textAlignVertical: 'center',
  },
  inputPlusButton: {
    marginRight: 10,
  },
  sendButton: {},
  galleryContainer: {
    maxHeight: getResponsiveHeight(300),
    backgroundColor: '#fff',
    borderColor: '#ccc',
    marginTop: getResponsiveHeight(7),
  },
  galleryContent: {
    padding: 1,
  },
});
