// src/features/memory/screens/CreatePostScreen.jsx

/* eslint-disable react-native/no-inline-styles */
import React, {
  useState,
  useLayoutEffect,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from 'react';

import {
  Image as ImageCompressor,
  Video as VideoCompressor,
} from 'react-native-compressor';

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

import Video from 'react-native-video';
import FastImage from '@d11/react-native-fast-image';

import {
  getResponsiveWidth,
  getResponsiveHeight,
  getResponsiveFontSize,
} from '../../../utils/responsive';

import {getPresignedUrls, uploadFileToS3} from '../../../api/imageUrlApi';
import useHideTabBar from '../../../hooks/useHideTabBar';
import ToastModal from '../../../components/ToastModal';
import {HEADER_STYLES} from 'styles/style';

import {uploadPostApi} from 'api/uploadPostApi';
import {useDispatch, useSelector} from 'react-redux';
import {createCategoryThunk} from '../store/categoryThunk';
import formatDuration from '../../../utils/formatDuration';

import {getVideoThumbnail} from '../../../utils/videoThumbnail';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

export default function CreatePostPage({navigation, route}) {
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);

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

  /* =========================
   * helpers
   * ========================= */

  const showToast = useCallback(msg => {
    setToastMessage(msg);
    setToastVisible(true);
  }, []);

  const getItemUri = useCallback(item => {
    return typeof item === 'string' ? item : item?.uri || item?.path;
  }, []);

  const getExtFromUri = useCallback(uriOrObj => {
    const uri =
      typeof uriOrObj === 'string'
        ? uriOrObj
        : uriOrObj?.uri || uriOrObj?.path || '';
    const raw = uri.split('?')[0];
    const ext = raw.split('.').pop()?.toLowerCase();
    return ext || 'jpg';
  }, []);

  const inferContentTypeByExt = useCallback(ext => {
    if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
    if (ext === 'png') return 'image/png';
    if (ext === 'webp') return 'image/webp';
    if (ext === 'mp4') return 'video/mp4';
    if (ext === 'mov') return 'video/quicktime';
    return 'application/octet-stream';
  }, []);

  const inferPostType = useCallback(ext => {
    if (ext === 'mp4' || ext === 'mov') return 'video';
    return 'image';
  }, []);

  const isVideoItem = useCallback(
    item => {
      if (typeof item === 'string') {
        const ext = getExtFromUri(item);
        return ext === 'mp4' || ext === 'mov';
      }
      const ext = getExtFromUri(item);
      return item?.isVideo === true || ext === 'mp4' || ext === 'mov';
    },
    [getExtFromUri],
  );

  const getDuration = useCallback(item => {
    return typeof item === 'string' ? 0 : item?.duration ?? 0;
  }, []);

  /* =========================
   * ✅ video thumbnail cache
   * ========================= */

  const [videoThumbMap, setVideoThumbMap] = useState({}); // { [videoUri]: thumbUri }
  const thumbLoadingRef = useRef(new Set());

  const ensureVideoThumb = useCallback(
    async item => {
      try {
        if (!isVideoItem(item)) return;

        const uri = getItemUri(item);
        if (!uri) return;

        if (videoThumbMap[uri]) return;
        if (thumbLoadingRef.current.has(uri)) return;

        thumbLoadingRef.current.add(uri);

        const t = await getVideoThumbnail(uri);
        const thumbUri = t?.uri || null;

        if (thumbUri) {
          setVideoThumbMap(prev => ({...prev, [uri]: thumbUri}));
        }
      } catch {
        // ignore
      } finally {
        const uri = getItemUri(item);
        if (uri) thumbLoadingRef.current.delete(uri);
      }
    },
    [getItemUri, isVideoItem, videoThumbMap],
  );

  const hasExtra = selectedImages.length > 3;
  const gridImages = useMemo(
    () => (hasExtra ? selectedImages.slice(0, 3) : selectedImages),
    [selectedImages, hasExtra],
  );

  useEffect(() => {
    (async () => {
      for (const item of gridImages) {
        if (isVideoItem(item)) await ensureVideoThumb(item);
      }
    })();
  }, [gridImages, isVideoItem, ensureVideoThumb]);

  /* =========================
   * ✅ compress
   * ========================= */

  const compressIfNeeded = useCallback(
    async item => {
      const uri = getItemUri(item);
      if (!uri) return {uri, ext: getExtFromUri(item)};

      // ✅ 영상 압축
      if (isVideoItem(item)) {
        const compressedUri = await VideoCompressor.compress(uri, {
          compressionMethod: 'auto',
          // minimumFileSizeForCompress 옵션이 버전에 따라 없으면 빼도 됨
          minimumFileSizeForCompress: 5,
        });

        const ext = getExtFromUri(compressedUri) || 'mp4';
        return {uri: compressedUri, ext};
      }

      // ✅ 이미지 압축(원치 않으면 이 블록 통째로 지워도 됨)
      const compressedUri = await ImageCompressor.compress(uri, {
        compressionMethod: 'auto',
        quality: 0.8,
      });
      const ext = getExtFromUri(compressedUri) || 'jpg';
      return {uri: compressedUri, ext};
    },
    [getItemUri, getExtFromUri, isVideoItem],
  );

  /* =========================
   * upload
   * ========================= */

  const handleUpload = useCallback(async () => {
    if (isUploading) return;

    const {selectedCategory} = route.params ?? {};

    if (!selectedCategory) {
      showToast('카테고리를 먼저 선택해 주세요.');
      return;
    }
    if (!familyId || !userId) {
      showToast('로그인 정보를 확인해 주세요.');
      return;
    }

    try {
      setIsUploading(true);

      let finalCategoryId = selectedCategory.categoryId;

      if (selectedCategory.isTemporary) {
        const action = await dispatch(
          createCategoryThunk({
            title: selectedCategory.title,
            familyId,
          }),
        );

        if (action.meta.requestStatus !== 'fulfilled') {
          showToast('카테고리 생성에 실패했어요.');
          return;
        }

        finalCategoryId =
          action.payload?.categoryId ?? selectedCategory.categoryId;
      }

      let imageUrls = [];
      let postTypes = [];

      if (selectedImages.length > 0) {
        const now = Date.now();

        // ✅ 1) 압축 먼저 하고, 압축 결과 기준으로 presigned 요청
        const filesForUpload = [];
        for (let i = 0; i < selectedImages.length; i++) {
          const item = selectedImages[i];

          const {uri: compressedUri, ext} = await compressIfNeeded(item);

          if (!compressedUri) {
            showToast('파일 경로를 불러오지 못했어요.');
            return;
          }

          const fileName = `media_${now}_${i}.${ext}`;
          const contentType = inferContentTypeByExt(ext);
          const postType = inferPostType(ext);

          filesForUpload.push({
            uri: compressedUri,
            fileName,
            contentType,
            postType,
          });
        }

        const presignedUrls = await getPresignedUrls(
          filesForUpload.map(f => ({
            fileName: f.fileName,
            contentType: f.contentType,
          })),
        );

        // ✅ 2) 압축된 uri로 PUT
        for (let i = 0; i < filesForUpload.length; i++) {
          await uploadFileToS3(
            presignedUrls[i],
            filesForUpload[i].uri,
            filesForUpload[i].contentType,
            filesForUpload[i].fileName,
          );
        }

        imageUrls = filesForUpload.map(f => f.fileName);
        postTypes = filesForUpload.map(f => f.postType);
      }

      const newPost = {
        authorId: userId,
        content: text || '',
        familyId,
        categoryId: finalCategoryId,
        imageUrls,
        postTypes,
      };

      await uploadPostApi(newPost);
      setSuccessModalVisible(true);
    } catch (e) {
      showToast('업로드 중 오류가 발생했어요.');
    } finally {
      setIsUploading(false);
    }
  }, [
    isUploading,
    route?.params,
    selectedImages,
    text,
    familyId,
    userId,
    dispatch,
    showToast,
    inferContentTypeByExt,
    inferPostType,
    compressIfNeeded,
  ]);

  /* =========================
   * header
   * ========================= */

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => <Text style={styles.headerText}>글쓰기</Text>,
      headerRight: () => (
        <TouchableOpacity
          onPress={handleUpload}
          disabled={isUploading}
          style={{marginRight: getResponsiveWidth(10)}}>
          <Image
            source={require('../../../assets/icons/check.png')}
            style={[styles.headerCheckIcon, isUploading && {opacity: 0.4}]}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleUpload, isUploading]);

  /* =========================
   * modal pan
   * ========================= */

  const translateY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dy) > Math.abs(g.dx) && Math.abs(g.dy) > 5,
      onPanResponderMove: (_, g) => {
        if (g.dy < 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (Math.abs(g.dy) > 120 || g.vy < -1.2) {
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
          }).start();
        }
      },
    }),
  ).current;

  /* =========================
   * UI
   * ========================= */

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

        {/* 미리보기 그리드 */}
        {gridImages.length > 0 && (
          <View style={styles.gridContainer}>
            {gridImages.map((item, index) => {
              const uri = getItemUri(item);
              const isVideo = isVideoItem(item);
              const thumbUri = isVideo && uri ? videoThumbMap[uri] : null;

              // ✅ 렌더 중 호출은 과호출될 수 있어서 requestAnimationFrame으로 한 번 감쌈
              if (isVideo && uri && !thumbUri) {
                requestAnimationFrame(() => ensureVideoThumb(item));
              }

              return (
                <Pressable
                  key={(uri || 'unknown') + index}
                  style={styles.gridImageWrapper}
                  onPress={() => {
                    setCurrentIndex(index);
                    setModalVisible(true);
                  }}>
                  {isVideo ? (
                    thumbUri ? (
                      <FastImage
                        source={{
                          uri: thumbUri,
                          priority: FastImage.priority.normal,
                          cache: FastImage.cacheControl.immutable,
                        }}
                        style={styles.gridImage}
                        resizeMode={FastImage.resizeMode.cover}
                      />
                    ) : (
                      <View style={[styles.gridImage, styles.thumbFallback]} />
                    )
                  ) : (
                    <Image source={{uri}} style={styles.gridImage} />
                  )}

                  {isVideo && (
                    <>
                      <View pointerEvents="none" style={styles.playOverlay}>
                        <View style={styles.playTriangle} />
                      </View>

                      <View pointerEvents="none" style={styles.videoBadge}>
                        <Text style={styles.videoBadgeText}>
                          {formatDuration(getDuration(item))}
                        </Text>
                      </View>
                    </>
                  )}

                  {hasExtra && index === gridImages.length - 1 && (
                    <View pointerEvents="none" style={styles.moreOverlay}>
                      <Text style={styles.moreOverlayText}>
                        +{selectedImages.length - 3}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        <TextInput
          style={styles.input}
          multiline
          value={text}
          onChangeText={setText}
          placeholder="글로 남긴 추억은 더 생생해요"
          placeholderTextColor="#999"
        />

        {/* 전체 미리보기 모달 */}
        <Modal
          visible={modalVisible}
          transparent
          onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            {/* ✅ 닫기 버튼: FlatList보다 위 + pointerEvents + zIndex/elevation */}
            <Pressable
              style={styles.modalClose}
              onPress={() => setModalVisible(false)}
              hitSlop={12}>
              <Text style={{color: '#fff'}}>닫기</Text>
            </Pressable>

            {/* ✅ FlatList가 터치 다 먹는 경우가 있어서 contentContainerStyle로 여백 */}
            <FlatList
              data={selectedImages}
              horizontal
              pagingEnabled
              initialScrollIndex={currentIndex}
              keyExtractor={(item, idx) => `${getItemUri(item)}-${idx}`}
              getItemLayout={(_, i) => ({
                length: SCREEN_WIDTH,
                offset: SCREEN_WIDTH * i,
                index: i,
              })}
              onScrollToIndexFailed={info => {
                // iOS/Android 둘 다 안전하게
                requestAnimationFrame(() => {
                  // 대충 근처로 이동
                  const offset = info.averageItemLength * info.index;
                  info?.highestMeasuredFrameIndex;
                  // eslint-disable-next-line no-unused-expressions
                  info;
                });
              }}
              renderItem={({item}) => (
                <Animated.View
                  {...panResponder.panHandlers}
                  style={[
                    styles.fullImageWrapper,
                    {transform: [{translateY}]},
                  ]}>
                  {isVideoItem(item) ? (
                    <Video
                      source={{uri: getItemUri(item)}}
                      style={styles.fullImage}
                      resizeMode="contain"
                      controls
                    />
                  ) : (
                    <Image
                      source={{uri: getItemUri(item)}}
                      style={styles.fullImage}
                    />
                  )}
                </Animated.View>
              )}
            />
          </View>
        </Modal>

        <ToastModal
          visible={successModalVisible}
          message="게시글을 업로드했어요"
          onClose={() => {
            setSuccessModalVisible(false);
            navigation.navigate('추억');
          }}
        />

        <ToastModal
          visible={toastVisible}
          message={toastMessage}
          onClose={() => setToastVisible(false)}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

/* =========================
 * styles
 * ========================= */

const H_MARGIN = getResponsiveWidth(8);
const SIDE_PADDING = getResponsiveWidth(15);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: SIDE_PADDING,
  },
  headerText: {
    fontSize: HEADER_STYLES.defaultTitleFontSize,
    fontFamily: HEADER_STYLES.defaultTitleFontFamily,
  },
  headerCheckIcon: {
    width: HEADER_STYLES.headerRightIconWidth,
    height: HEADER_STYLES.headerRightIconHeight,
    resizeMode: 'contain',
  },

  gridContainer: {
    flexDirection: 'row',
    marginBottom: getResponsiveHeight(16),
  },
  gridImageWrapper: {
    width: (SCREEN_WIDTH - SIDE_PADDING * 2 - H_MARGIN * 2) / 3,
    aspectRatio: 1,
    marginRight: H_MARGIN,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbFallback: {
    backgroundColor: '#E5E7EB',
  },

  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 18,
    borderTopWidth: 12,
    borderBottomWidth: 12,
    borderLeftColor: 'rgba(255,255,255,0.95)',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 4,
  },

  videoBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoBadgeText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(11),
    fontWeight: '600',
  },

  moreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreOverlayText: {
    color: '#fff',
    fontSize: getResponsiveFontSize(18),
    fontFamily: 'Pretendard-SemiBold',
  },

  input: {
    height: getResponsiveHeight(200),
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    position: 'relative',
  },
  fullImageWrapper: {
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '80%',
    resizeMode: 'contain',
  },

  // ✅ 여기 핵심: FlatList 위에 "확실히" 뜨게 + 터치도 먹게
  modalClose: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 30,
    right: 20,
    zIndex: 999999,
    elevation: 999999, // android
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 10,
  },
});
