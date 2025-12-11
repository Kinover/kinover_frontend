// src/features/memory/screens/CreatePostScreen.jsx

import React, {
  useState,
  useLayoutEffect,
  useCallback,
  useRef,
  useEffect,
} from 'react';
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
  Animated,
  PanResponder,
} from 'react-native';

import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveFontSize,
  getResponsiveIconSize,
} from '../../../utils/responsive';

import {getPresignedUrls, uploadFileToS3} from '../../../api/imageUrlApi';
import useHideTabBar from '../../../hooks/useHideTabBar';
import ToastModal from '../../../components/ToastModal';
import {HEADER_STYLES} from 'styles/style';

import {uploadPostApi} from 'api/uploadPostApi';
import {useDispatch, useSelector} from 'react-redux';
import {createCategoryThunk} from '../store/categoryThunk';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

export default function CreatePostPage({navigation, route}) {
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [focused, setFocused] = useState(false);

  const {selectedImages: initImages} = route.params ?? {};
  const [selectedImages] = useState(initImages ?? []);

  const [modalVisible, setModalVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const {userId} = useSelector(s => s.user);
  const {familyId} = useSelector(s => s.family);
  const dispatch = useDispatch();

  useHideTabBar({stayHidden: true});

  // Toast
  const showToast = useCallback(msg => {
    setToastMessage(msg);
    setToastVisible(true);
  }, []);

  // 업로드 핸들러
  const handleUpload = useCallback(async () => {
    if (isUploading) {
      console.log('⚠️ 이미 업로드 중입니다. 중복 요청 방지');
      return;
    }

    console.log('➡️ 업로드 시작');
    console.log('🧾 route.params:', route?.params);
    console.log('🧾 선택된 이미지 개수:', selectedImages.length);
    console.log('🧾 userId:', userId, 'familyId:', familyId);

    const {selectedCategory} = route.params ?? {};
    console.log('🧾 선택된 카테고리:', selectedCategory);

    // 기본 체크
    if (!selectedCategory) {
      console.log('❌ selectedCategory 없음');
      showToast('카테고리를 먼저 선택해 주세요.');
      return;
    }
    if (!familyId || !userId) {
      console.log('❌ familyId 또는 userId 없음', {familyId, userId});
      showToast('로그인 또는 가족 정보를 확인해 주세요.');
      return;
    }

    try {
      setIsUploading(true);

      // 최종 카테고리 id
      let finalCategoryId = selectedCategory.categoryId;
      console.log('🔹 초기 finalCategoryId:', finalCategoryId);

      // 새 카테고리면 먼저 생성
      if (selectedCategory.isTemporary) {
        console.log('🟡 임시 카테고리이므로 createCategoryThunk 실행');

        const action = await dispatch(
          createCategoryThunk({
            title: selectedCategory.title,
            familyId,
          }),
        );

        console.log('📩 createCategoryThunk 결과:', action);

        if (action.meta.requestStatus !== 'fulfilled') {
          console.log('❌ createCategoryThunk 실패:', action.payload);
          showToast('카테고리 생성 중 문제가 발생했어요.');
          setIsUploading(false);
          return;
        }

        const newCat = action.payload;
        console.log('🧩 새 카테고리 응답 newCat:', newCat);

        finalCategoryId =
          newCat?.categoryId ??
          newCat?.id ??
          newCat?.data?.categoryId ??
          newCat?.data?.id ??
          selectedCategory.categoryId;

        console.log(
          '✅ 최종 finalCategoryId (카테고리 생성 후):',
          finalCategoryId,
        );
      }

      // 이미지 업로드(S3)
      let imageUrls = [];
      let postTypes = [];

      if (selectedImages.length > 0) {
        const now = Date.now();

        const fileNames = selectedImages.map((uri, i) => {
          let ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
          if (ext === 'mov') ext = 'mp4';
          return `media_${now}_${i}_${Math.floor(Math.random() * 1000)}.${ext}`;
        });

        console.log('🖼 생성된 파일 이름 목록:', fileNames);

        const presignedUrls = await getPresignedUrls(fileNames);
        console.log('🔗 presignedUrls 개수:', presignedUrls.length);

        for (let i = 0; i < selectedImages.length; i++) {
          console.log(
            `⬆️ [${i + 1}/${selectedImages.length}] S3 업로드 시작`,
            '\n   fileName:',
            fileNames[i],
            '\n   uri:',
            selectedImages[i],
          );
          await uploadFileToS3(
            presignedUrls[i],
            selectedImages[i],
            fileNames[i],
          );
          console.log(`✅ [${i + 1}/${selectedImages.length}] S3 업로드 완료`);
        }

        imageUrls = [...fileNames];
        postTypes = selectedImages.map(() => 'image');

        console.log('🧾 업로드 후 imageUrls:', imageUrls);
        console.log('🧾 업로드 후 postTypes:', postTypes);
      } else {
        console.log('ℹ️ 이미지 없이 텍스트만 업로드합니다.');
      }

      // 게시글 업로드
      const newPost = {
        authorId: userId,
        content: text || '',
        familyId,
        categoryId: finalCategoryId,
        imageUrls,
        postTypes,
      };

      console.log('📮 업로드할 게시글 데이터(newPost):', newPost);

      const res = await uploadPostApi(newPost);
      console.log('✅ 게시글 업로드 성공 응답:', res);

      setSuccessModalVisible(true);
    } catch (error) {
      const status = error?.response?.status;
      const data = error?.response?.data;

      console.log('❌ 업로드 중 에러 status:', status);
      console.log('❌ 업로드 중 에러 data:', data);
      console.error('🔥 업로드 중 오류 발생:', data || error);

      showToast('업로드 중 문제가 발생했어요.');
    } finally {
      console.log('⬅️ 업로드 로직 종료, isUploading false로 변경');
      setIsUploading(false);
    }
  }, [
    route?.params,
    selectedImages,
    text,
    familyId,
    userId,
    isUploading,
    showToast,
    dispatch,
  ]);

  // 헤더 설정
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>글쓰기</Text>
        </View>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={handleUpload}
          style={{marginRight: getResponsiveWidth(10)}}
          disabled={isUploading}>
          <Image
            source={require('../../../assets/icons/check.png')}
            style={[styles.headerCheckIcon, isUploading && {opacity: 0.5}]}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleUpload, isUploading]);

  // Grid에 보여줄 이미지 (최대 3장)
  const hasExtra = selectedImages.length > 3;
  const gridImages = hasExtra ? selectedImages.slice(0, 3) : selectedImages;

  // 풀 이미지 스와이프 닫기 애니메이션
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (modalVisible) {
      translateY.setValue(0);
    }
  }, [modalVisible, translateY]);

  const scale = translateY.interpolate({
    inputRange: [-200, 0],
    outputRange: [0.85, 1],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const {dx, dy} = gestureState;
        return Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        const {dy} = gestureState;
        if (dy < 0) {
          translateY.setValue(dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const {dy, vy} = gestureState;
        const distance = Math.abs(dy);

        const SHOULD_CLOSE = distance > 120 || vy < -1.2;

        if (SHOULD_CLOSE) {
          Animated.timing(translateY, {
            toValue: -300,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(0);
            setModalVisible(false);
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 8,
          }).start();
        }
      },
    }),
  ).current;

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

        {/* 사진 그리드 */}
        {gridImages.length > 0 && (
          <View style={styles.gridContainer}>
            {gridImages.map((item, index) => (
              <Pressable
                key={item + index}
                onPress={() => {
                  setCurrentIndex(index);
                  setModalVisible(true);
                }}
                style={styles.gridImageWrapper}>
                <Image source={{uri: item}} style={styles.gridImage} />

                {hasExtra && index === gridImages.length - 1 && (
                  <View style={styles.moreOverlay}>
                    <Text style={styles.moreOverlayText}>
                      +{selectedImages.length - 3}
                    </Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        )}

        {/* 🔹 내용 입력 – 높이 고정 + 내부 스크롤 */}
        <TextInput
          style={[
            styles.input,
            focused && {borderColor: '#9C9C9C', backgroundColor: '#fff'},
          ]}
          multiline
          scrollEnabled={true}         // ← 내용 많아지면 TextInput 안에서 스크롤
          value={text}
          onChangeText={setText}
          placeholder="글로 남긴 추억은 더 생생해요"
          placeholderTextColor="#999"
          textAlignVertical="top"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />

        {/* 전체 이미지 모달 */}
        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
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
                const idx = Math.round(
                  e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
                );
                setCurrentIndex(idx);
              }}
              renderItem={({item}) => (
                <View style={styles.fullImageWrapper}>
                  <Animated.View
                    {...panResponder.panHandlers}
                    style={[
                      styles.fullImageInner,
                      {
                        transform: [{translateY}, {scale}],
                      },
                    ]}>
                    <Image source={{uri: item}} style={styles.fullImage} />
                  </Animated.View>
                </View>
              )}
            />

            <View style={styles.imageCountBadge}>
              <Text style={styles.imageCountText}>
                {currentIndex + 1} / {selectedImages.length}
              </Text>
            </View>

            <Pressable
              style={styles.modalCloseArea}
              onPress={() => setModalVisible(false)}>
              <Image
                source={require('../../../assets/images/clearBt1.png')}
                style={{
                  width: getResponsiveWidth(20),
                  height: getResponsiveHeight(20),
                  resizeMode: 'contain',
                }}
              />
            </Pressable>
          </View>
        </Modal>

        {/* 업로드 성공 토스트 */}
        <ToastModal
          message="게시글을 업로드했어요"
          visible={successModalVisible}
          onClose={() => {
            setSuccessModalVisible(false);
            navigation.navigate('추억');
          }}
        />

        {/* 오류 토스트 */}
        <ToastModal
          message={toastMessage}
          visible={toastVisible}
          onClose={() => setToastVisible(false)}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const H_MARGIN = getResponsiveWidth(8);
const SIDE_PADDING = getResponsiveWidth(15);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopWidth: 2,
    borderColor: '#E5E5E5',
    padding: SIDE_PADDING,
  },

  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: getResponsiveHeight(16),
  },
  gridImageWrapper: {
    width: (SCREEN_WIDTH - SIDE_PADDING * 2 - H_MARGIN * 2) / 3,
    aspectRatio: 1,
    marginRight: H_MARGIN,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  moreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreOverlayText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(18),
    fontFamily: 'Pretendard-SemiBold',
  },

  // 🔹 여기: 높이 고정
  input: {
    height: getResponsiveHeight(200),   // ← 고정 높이
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 12,
    padding: getResponsiveWidth(12),
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Regular',
    backgroundColor: '#FAFAFA',
    marginBottom: getResponsiveHeight(20),
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
    fontSize: HEADER_STYLES.defaultTitleFontSize,
    fontFamily: HEADER_STYLES.defaultTitleFontFamily,
    color: HEADER_STYLES.defaultTitleFontColor,
    lineHeight: getResponsiveHeight(26),
  },
  headerCheckIcon: {
    width: HEADER_STYLES.headerRightIconWidth,
    height: HEADER_STYLES.headerRightIconHeight,
    marginRight: HEADER_STYLES.headerRightIconRightPadding,
    resizeMode: 'contain',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImageWrapper: {
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImageInner: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullImage: {
    width: '100%',
    height: '80%',
    resizeMode: 'contain',
    borderRadius: 10,
  },
  modalCloseArea: {
    position: 'absolute',
    top:
      Platform.OS === 'ios' ? getResponsiveHeight(50) : getResponsiveHeight(25),
    right: getResponsiveWidth(15),
    width: getResponsiveIconSize(24),
    height: getResponsiveIconSize(24),
  },
  imageCountBadge: {
    position: 'absolute',
    top:
      Platform.OS === 'ios' ? getResponsiveHeight(50) : getResponsiveHeight(20),
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  imageCountText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(13),
    fontWeight: '600',
  },
});
