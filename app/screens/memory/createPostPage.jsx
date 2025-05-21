import React, { useState, useLayoutEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {
  getResponsiveWidth,
  getResponsiveFontSize,
} from '../../utils/responsive';
import { useSelector } from 'react-redux';
import { getPresignedUrls, uploadImageToS3 } from '../../api/imageUrlApi';
import { uploadPostApi } from '../../api/uploadPostApi';

// ✅ 미디어 타입 추출 함수 (파일 확장자 기반)
const getMediaTypeFromUri = (uri) => {
  if (!uri || typeof uri !== 'string') return 'UNKNOWN';
  const lower = uri.toLowerCase();

  if (lower.match(/\.(jpg|jpeg|png|gif|webp)$/)) return 'IMAGE';
  if (lower.match(/\.(mp4|mov|avi|wmv|flv|mkv)$/)) return 'VIDEO';

  return 'UNKNOWN';
};

export default function CreatePostPage({ navigation, route }) {
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const user = useSelector(state => state.user);
  const family = useSelector(state => state.family);
  const { selectedCategory, selectedImages } = route.params;

  const handleUpload = async () => {
    if (isUploading) return;
    setIsUploading(true);

    try {
      const fileNames = selectedImages.map(
        (_, i) =>
          `img_${Date.now()}_${i}_${Math.floor(Math.random() * 1000)}.jpg`,
      );

      const presignedUrls = await getPresignedUrls(fileNames);

      for (let i = 0; i < selectedImages.length; i++) {
        await uploadImageToS3(presignedUrls[i], selectedImages[i]);
      }

      const postTypes = selectedImages.map(uri => getMediaTypeFromUri(uri));

      const payload = {
        authorId: user.userId,
        categoryId: selectedCategory?.categoryId,
        imageUrls: fileNames,
        postTypes,
        content: text,
        familyId: family.familyId,
      };

      console.log('🧾 selectedImages:', selectedImages);
      console.log('🧾 postTypes:', postTypes);
      console.log('📦 게시글 업로드 payload:', JSON.stringify(payload, null, 2));

      await uploadPostApi(payload);

      console.log('✅ 게시글 업로드 완료');
      navigation.navigate('추억화면', { selectedCategory });
    } catch (err) {
      console.error('게시글 업로드 실패:', err);
    } finally {
      setIsUploading(false);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>글 작성하기</Text>
        </View>
      ),
      headerRight: () => (
        <TouchableOpacity onPress={handleUpload} style={{ marginRight: 15 }}>
          <Image
            source={require('../../assets/images/check-bt.png')}
            style={{
              width: 25,
              height: 25,
              resizeMode: 'contain',
              right: getResponsiveWidth(10),
            }}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleUpload]);

  return (
    <View style={styles.container}>
      {isUploading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#F8B500" />
        </View>
      )}
      <TextInput
        style={styles.input}
        multiline
        value={text}
        onChangeText={setText}
        placeholder="글로 남긴 추억은 더 생생해요.."
        placeholderTextColor="#999"
        textAlignVertical="top"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    borderTopWidth: 3,
    borderColor: '#D3D3D3',
    padding: getResponsiveWidth(10),
  },
  input: {
    height: '70%',
    borderWidth: 1,
    borderColor: '#888888',
    padding: getResponsiveWidth(10),
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'Pretendard-Regular',
    overflow: 'scroll',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  headerContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: getResponsiveFontSize(20),
    textAlign: 'center',
  },
});
