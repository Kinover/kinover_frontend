import React, {useState, useLayoutEffect} from 'react';
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
import {useSelector, useDispatch} from 'react-redux';
import {getPresignedUrls, uploadImageToS3} from '../../../api/imageUrlApi';
import {uploadPostApi} from '../../../api/uploadPostApi';
import {
  createCategoryThunk,
  fetchCategoryThunk,
} from '../../../redux/thunk/categoryThunk';

const getMediaTypeFromUri = uri => {
  if (!uri || typeof uri !== 'string') return 'UNKNOWN';
  const lower = uri.toLowerCase();
  if (lower.match(/\.(jpg|jpeg|png|gif|webp)$/)) return 'IMAGE';
  if (lower.match(/\.(mp4|mov|avi|wmv|flv|mkv)$/)) return 'VIDEO';
  return 'UNKNOWN';
};

export default function CreatePostPage({navigation, route}) {
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const user = useSelector(state => state.user);
  const family = useSelector(state => state.family);
  const dispatch = useDispatch();
  const {selectedCategory, selectedImages} = route.params;

  const handleUpload = async () => {
    if (isUploading) return;
    setIsUploading(true);

    try {
      console.log('[업로드 시작]');
      console.log('선택된 카테고리:', selectedCategory);
      console.log('선택된 이미지 수:', selectedImages?.length);

      if (selectedCategory?.isTemporary) {
        console.log('[임시 카테고리 감지됨] → 카테고리 생성 시도');

        const result = await dispatch(
          createCategoryThunk({
            categoryId: selectedCategory.categoryId,
            title: selectedCategory.title,
            familyId: family.familyId,
          }),
        );

        if (createCategoryThunk.fulfilled.match(result)) {
          console.log('✅ 카테고리 생성 성공:', result.payload);

          // ✅ 먼저 기다렸다가
          await new Promise(resolve => setTimeout(resolve, 300));

          console.log('📥 카테고리 목록 다시 불러오는 중...');
          await dispatch(fetchCategoryThunk(family.familyId));
        } else {
          console.error('❌ 카테고리 생성 실패:', result);
          return;
        }
      }

      console.log('[파일 이름 생성 중]');
      const fileNames = selectedImages.map(
        (_, i) =>
          `img_${Date.now()}_${i}f_${Math.floor(Math.random() * 1000)}.jpg`,
      );

      console.log('🪪 파일 이름 목록:', fileNames);

      console.log('[Presigned URL 요청]');
      const presignedUrls = await getPresignedUrls(fileNames);
      console.log('✅ Presigned URLs:', presignedUrls);

      console.log('[이미지 업로드 시작]');
      for (let i = 0; i < selectedImages.length; i++) {
        console.log(`📤 S3 업로드: ${selectedImages[i]} → ${fileNames[i]}`);
        await uploadImageToS3(presignedUrls[i], selectedImages[i]);
      }
      console.log('✅ 이미지 업로드 완료');

      const postTypes = selectedImages.map(uri => getMediaTypeFromUri(uri));
      console.log('🧾 postTypes:', postTypes);

      const payload = {
        authorId: user.userId,
        categoryId: selectedCategory.categoryId,
        imageUrls: fileNames,
        postTypes,
        content: text,
        familyId: family.familyId,
      };

      console.log('[최종 업로드 payload]', payload);

      await uploadPostApi(payload);
      console.log('🎉 게시글 업로드 성공!');

      navigation.navigate('추억');
    } catch (err) {
      console.error('🚨 게시글 업로드 실패:', err);
    } finally {
      setIsUploading(false);
      console.log('[업로드 종료]');
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
