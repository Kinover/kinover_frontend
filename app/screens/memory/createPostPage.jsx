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
  getResponsiveHeight,
} from '../../utils/responsive';
import { useSelector } from 'react-redux';
import { getPresignedUrls, uploadImageToS3 } from '../../api/imageUrlApi';
import { uploadPostApi } from '../../api/uploadPostApi';
import { getUserIdFromToken } from '../../api/getUserIdFromToken';

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
      // ✅ 파일 이름 미리 생성
      const fileNames = selectedImages.map((_, i) => `img_${Date.now()}_${i}_${Math.floor(Math.random() * 1000)}.jpg`);

      // ✅ presigned URLs 요청
      const presignedUrls = await getPresignedUrls(fileNames);

      // ✅ 순차적 S3 업로드
      for (let i = 0; i < selectedImages.length; i++) {
        await uploadImageToS3(presignedUrls[i], selectedImages[i]);
      }

      // ✅ userId 가져오기
      const tokenUserId = await getUserIdFromToken();

      // ✅ 게시글 업로드
      const payload = {
        authorId: Number(tokenUserId),
        categoryId: selectedCategory?.categoryId,
        imageUrls: fileNames, // ✅ 이제는 파일 이름만 전송
        content: text,
        familyId: family.familyId,
      };

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
        <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: getResponsiveFontSize(20), textAlign: 'center' }}>
            글 작성하기
          </Text>
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
    height: '60%',
    borderWidth: 1,
    borderColor: '#888888',
    padding: getResponsiveWidth(10),
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Regular',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});
