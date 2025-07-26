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
      let finalCategoryId = selectedCategory?.categoryId;
      let finalCategory = selectedCategory;

      if (selectedCategory?.isTemporary) {
        const result = await dispatch(
          createCategoryThunk({
            title: selectedCategory.title,
            familyId: family.familyId,
          }),
        );

        if (createCategoryThunk.fulfilled.match(result)) {
          finalCategoryId = result.payload.categoryId;
          finalCategory = result.payload;

          await dispatch(fetchCategoryThunk(family.familyId));
          await new Promise(resolve => setTimeout(resolve, 300));
        } else {
          console.error('카테고리 생성 실패', result);
          return;
        }
      }

      const fileNames = selectedImages.map(
        (_, i) =>
          `img_${Date.now()}_${i}f_${Math.floor(Math.random() * 1000)}.jpg`,
      );

      const presignedUrls = await getPresignedUrls(fileNames);

      for (let i = 0; i < selectedImages.length; i++) {
        await uploadImageToS3(presignedUrls[i], selectedImages[i]);
      }

      const postTypes = selectedImages.map(uri => getMediaTypeFromUri(uri));

      const payload = {
        authorId: user.userId,
        categoryId: finalCategoryId,
        imageUrls: fileNames,
        postTypes,
        content: text,
        familyId: family.familyId,
      };

      await uploadPostApi(payload);
      navigation.navigate('추억', {selectedCategory: finalCategory});
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
