import React, {useState, useLayoutEffect, useCallback} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  TouchableWithoutFeedbackComponent,
} from 'react-native';
import Animated, {ZoomIn, ZoomOut} from 'react-native-reanimated';
import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../../utils/responsive';
import {useSelector} from 'react-redux';
import {getPresignedUrls, uploadImageToS3} from '../../../api/imageUrlApi';
import {uploadPostApi} from '../../../api/uploadPostApi';
import useHideTabBar from '../../../hooks/useHideTabBar';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const getMediaTypeFromUri = uri => {
  if (!uri || typeof uri !== 'string') return 'unknown';
  const lower = uri.toLowerCase();
  if (lower.match(/\.(jpg|jpeg|png|gif|webp)$/)) return 'image';
  if (lower.match(/\.(mp4|mov|avi|wmv|flv|mkv)$/)) return 'video';
  return 'unknown';
};

export default function CreatePostPage({navigation, route}) {
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [focused, setFocused] = useState(false);

  const user = useSelector(state => state.user);
  const family = useSelector(state => state.family);

  const {selectedCategory, selectedImages: initImages} = route.params ?? {};
  const [selectedImages, setSelectedImages] = useState(initImages ?? []);

  // 풀스크린 뷰어 상태
  const [modalVisible, setModalVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const categoryId = selectedCategory?.categoryId;
  const categoryTitle = selectedCategory?.title ?? '';

  useHideTabBar({stayHidden: true});

  const handleRemoveImage = useCallback(
    uri => {
      setSelectedImages(prev => prev.filter(img => img !== uri));
    },
    [setSelectedImages],
  );

  const handleUpload = useCallback(async () => {
    if (isUploading) return;
    setIsUploading(true);
    try {
      if (!categoryTitle) throw new Error('카테고리 제목이 없어요.');
      if (!Array.isArray(selectedImages) || selectedImages.length === 0) {
        throw new Error('이미지를 선택해주세요.');
      }
      const now = Date.now();
      const fileNames = selectedImages.map((uri, i) => {
        const ext = (uri?.split('.').pop() || 'jpg').toLowerCase();
        return `img_${now}_${i}_${Math.floor(Math.random() * 1000)}.${ext}`;
      });
      const presignedUrls = await getPresignedUrls(fileNames);
      for (let i = 0; i < selectedImages.length; i++) {
        await uploadImageToS3(presignedUrls[i], selectedImages[i]);
      }
      const postTypes = selectedImages.map(getMediaTypeFromUri);
      const payload = {
        authorId: user.userId,
        familyId: String(family.familyId),
        categoryId,
        categoryTitle,
        imageUrls: fileNames,
        postTypes,
        content: text,
      };
      await uploadPostApi(payload);
      navigation.navigate('추억');
    } catch (err) {
      console.error('🚨 업로드 실패:', err);
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
          <Text style={styles.headerText}>내용 작성</Text>
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
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        {isUploading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#F8B500" />
          </View>
        )}

        {/* 글 작성 입력 */}
        <TextInput
          style={[
            styles.input,
            focused && {borderColor: '#9C9C9C', backgroundColor: '#fff'},
          ]}
          multiline
          value={text}
          onChangeText={setText}
          placeholder="글로 남긴 추억은 더 생생해요"
          placeholderTextColor="#999"
          textAlignVertical="top"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />

        {/* 선택한 사진 미리보기 */}
        {selectedImages.length > 0 && (
          <FlatList
            data={selectedImages}
            keyExtractor={(item, idx) => item + idx}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imageList}
            contentContainerStyle={{paddingHorizontal: getResponsiveWidth(5)}}
            renderItem={({item, index}) => (
              <Animated.View
                entering={ZoomIn.springify().damping(12)}
                exiting={ZoomOut}
                style={styles.imageWrapper}>
                <Pressable
                  onPress={() => {
                    setCurrentIndex(index);
                    setModalVisible(true);
                  }}>
                  <Image source={{uri: item}} style={styles.previewImage} />
                </Pressable>
                {/* 삭제 */}
                {/* <TouchableOpacity
                  style={styles.removeButton}
                  activeOpacity={0.8}
                  onPress={() => handleRemoveImage(item)}>
                  <Image
                    source={require('../../../assets/images/clearBt1.png')}
                    style={{width: '100%', height: '100%'}}></Image>
                </TouchableOpacity> */}
              </Animated.View>
            )}
          />
        )}

        {/* 풀스크린 뷰어 */}
        <Modal visible={modalVisible} transparent={true} animationType="fade">
          <View
            style={styles.modalOverlay}
            onPress={() => setModalVisible(false)}>
            <FlatList
              data={selectedImages}
              horizontal
              pagingEnabled
              initialScrollIndex={currentIndex}
              getItemLayout={(_, index) => ({
                length: SCREEN_WIDTH,
                offset: SCREEN_WIDTH * index,
                index,
              })}
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={e => {
                const index = Math.round(
                  e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
                );
                setCurrentIndex(index);
              }}
              renderItem={({item}) => (
                <View style={styles.fullImageWrapper}>
                  <Image source={{uri: item}} style={styles.fullImage} />
                </View>
              )}
            />

            {/* 👉 사진 장수 표시 */}
            <View style={styles.imageCountBadge}>
              <Text style={styles.imageCountText}>
                {currentIndex + 1} / {selectedImages.length}
              </Text>
            </View>

            <Pressable
              style={styles.modalCloseArea}
              onPress={() => setModalVisible(false)}
              hitSlop={{top: 15, bottom: 15, left: 15, right: 15}} // ✅ 터치 범위 확장
            >
              <Image
                source={require('../../../assets/images/clearBt1.png')}
                style={{width: '100%', height: '100%'}}></Image>
            </Pressable>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopWidth: 2,
    borderColor: '#E5E5E5',
    padding: getResponsiveWidth(15),
  },
  input: {
    minHeight: getResponsiveHeight(200),
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 12,
    padding: getResponsiveWidth(12),
    fontSize: getResponsiveFontSize(15),
    fontFamily: 'Pretendard-Regular',
    backgroundColor: '#FAFAFA',
    marginBottom: getResponsiveHeight(20),
  },
  imageList: {
    flexGrow: 0,
  },
  imageWrapper: {
    marginRight: getResponsiveWidth(12),
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  previewImage: {
    width: getResponsiveWidth(110),
    height: getResponsiveHeight(110),
    borderRadius: 12,
  },
  removeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    borderRadius: 50,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontSize: getResponsiveFontSize(14),
    fontWeight: 'bold',
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
    fontSize: Platform.OS==='ios'?getResponsiveFontSize(20):getResponsiveFontSize(18),
    textAlign: 'center',
    textAlignVertical: 'center',
    fontFamily: 'Pretendard-Regular',
    fontWeight:'semibold',
    color: '#101010',
    lineHeight:getResponsiveHeight(30),
  },
  headerCheckIcon: {
    width: getResponsiveWidth(28),
    height: getResponsiveHeight(28),
    marginRight: getResponsiveWidth(12),
    resizeMode: 'contain',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImageWrapper: {
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '90%',
    height: '80%',
    resizeMode: 'contain',
    borderRadius: 10,
  },
  modalCloseArea: {
    position: 'absolute',
    top:
      Platform.OS === 'ios' ? getResponsiveHeight(55) : getResponsiveHeight(35),
    right: 15,
    width: getResponsiveIconSize(25),
    height: getResponsiveIconSize(25),
  },
  modalCloseText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
  },
  imageCountBadge: {
    position: 'absolute',
    top:
      Platform.OS === 'android'
        ? getResponsiveHeight(30)
        : getResponsiveHeight(55),
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  imageCountText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
