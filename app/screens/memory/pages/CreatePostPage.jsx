import React, {useState, useLayoutEffect, useMemo, useCallback} from 'react';
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
  getResponsiveHeight,
  getResponsiveFontSize,
} from '../../../utils/responsive';
import {useSelector} from 'react-redux';
import {getPresignedUrls, uploadImageToS3} from '../../../api/imageUrlApi';
import {uploadPostApi} from '../../../api/uploadPostApi';

// ----- utils -----
const getMediaTypeFromUri = uri => {
  if (!uri || typeof uri !== 'string') return 'unknown';
  const lower = uri.toLowerCase();
  if (lower.match(/\.(jpg|jpeg|png|gif|webp)$/)) return 'image';
  if (lower.match(/\.(mp4|mov|avi|wmv|flv|mkv)$/)) return 'video';
  return 'unknown';
};

// UUID (crypto.randomUUID 지원되면 그거 써도 됨)
const genUuid = () =>
  (globalThis.crypto?.randomUUID?.() ??
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    }));

export default function CreatePostPage({navigation, route}) {
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const user = useSelector(state => state.user);
  const family = useSelector(state => state.family);

  const {selectedCategory, selectedImages} = route.params ?? {};

  const categoryId = String(selectedCategory?.categoryId);
  // if (!categoryId) throw new Error('카테고리 ID가 없어요.'); // 방어 코드

  const categoryTitle = selectedCategory?.title ?? '';

  const handleUpload = useCallback(async () => {
    if (isUploading) return;
    setIsUploading(true);

    try {
      if (!categoryTitle) throw new Error('카테고리 제목이 없어요.');
      if (!Array.isArray(selectedImages) || selectedImages.length === 0) {
        throw new Error('이미지를 선택해주세요.');
      }

      // 1) 파일 이름(확장자 유지 권장)
      const now = Date.now();
      const fileNames = selectedImages.map((uri, i) => {
        const ext = (uri?.split('.').pop() || 'jpg').toLowerCase();
        return `img_${now}_${i}_${Math.floor(Math.random() * 1000)}.${ext}`;
      });

      // 2) Presigned URL 요청 & 업로드
      const presignedUrls = await getPresignedUrls(fileNames);
      if (!Array.isArray(presignedUrls) || presignedUrls.length !== fileNames.length) {
        throw new Error('Presigned URL 응답 형식이 올바르지 않습니다.');
      }
      for (let i = 0; i < selectedImages.length; i++) {
        await uploadImageToS3(presignedUrls[i], selectedImages[i]);
      }

      // 3) 게시글 업로드 (카테고리 API 사용 X, id+title만 전송)
      const postTypes = selectedImages.map(getMediaTypeFromUri);
      const payload = {
        authorId: user.userId,
        familyId: String(family.familyId),
        categoryId,                 // ✅ 항상 포함
        categoryTitle,              // ✅ 항상 포함
        imageUrls: fileNames,       // 파일명 배열
        postTypes,                  // 'image' | 'video'
        content: text,
      };

      await uploadPostApi(payload);
      navigation.navigate('추억');
    } catch (err) {
      console.error('🚨 게시글 업로드 실패:', {
        status: err?.response?.status ?? err?.status ?? err?.code,
        message: err?.message,
        responseData: err?.response?.data,
      });
    } finally {
      setIsUploading(false);
    }
  }, [
    isUploading,
    selectedImages,
    text,
    user.userId,
    family.familyId,
    categoryId,
    categoryTitle,
    navigation,
  ]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>글 작성하기</Text>
        </View>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={handleUpload}
          style={{marginRight: getResponsiveWidth(10)}}>
          <Image
            source={require('../../../assets/icons/check.png')}
            style={styles.headerCheckIcon}
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
    height: getResponsiveHeight(400),
    borderWidth: 1,
    borderColor: '#888888',
    padding: getResponsiveWidth(10),
    fontSize: getResponsiveFontSize(16),
    fontFamily: 'Pretendard-Regular',
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
    fontFamily: 'Pretendard-Regular',
  },
  headerCheckIcon: {
    width: getResponsiveWidth(30),
    height: getResponsiveHeight(30),
    marginRight: getResponsiveWidth(15),
    resizeMode: 'contain',
  },
});
