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
  Pressable,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

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
import updatePostApi from 'api/updatePostApi';

import {useDispatch, useSelector} from 'react-redux';
import {createCategoryThunk} from '../store/categoryThunk';
import formatDuration from '../../../utils/formatDuration';
import {getVideoThumbnail} from '../../../utils/videoThumbnail';

// ✅ post 단건 조회 thunk
import {fetchPostByIdThunk, deletePostImageThunk} from '../store/memoryThunk';

// ✅ MediaViewer 적용
import MediaViewer from '../components/MediaViewer';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

const isHttpUrl = u => /^https?:\/\//i.test(String(u || ''));

const extractFileNameFromUrl = url => {
  try {
    const s = String(url || '');
    const noQuery = s.split('?')[0];
    const last = noQuery.split('/').pop();
    return last || '';
  } catch {
    return '';
  }
};

const logAxiosError = (tag, e) => {
  const status = e?.response?.status;
  const data = e?.response?.data;

  const method = e?.config?.method;
  const url = e?.config?.url;
  const baseURL = e?.config?.baseURL;

  let reqData = e?.config?.data;
  try {
    if (typeof reqData === 'string') reqData = JSON.parse(reqData);
  } catch {}

  console.log(`\n❌ [${tag}] AxiosError`);
  console.log('status:', status);
  console.log('url:', baseURL ? `${baseURL}${url}` : url);
  console.log('method:', method);
  console.log('request data:', reqData);
  console.log('response data:', data);
  console.log('raw message:', e?.message);
  console.log('raw:', e, '\n');
};

export default function CreatePostPage({navigation, route}) {
  const dispatch = useDispatch();
  const {userId} = useSelector(s => s.user);
  const {familyId} = useSelector(s => s.family);

  useHideTabBar({stayHidden: true});

  /** ✅ route params */
  const {
    selectedImages: initImages = [],
    selectedCategory: routeSelectedCategory = null,

    mode = '등록', // '등록' | '수정'
    postId = null,
    removedUrls: removedUrlsFromRoute = [],

    // (선택) 수정모드에서 내용 미리 채우고 싶으면 넘겨줘
    initialContent = '',
  } = route?.params ?? {};

  const isEditMode = mode === '수정';

  /** ✅ 수정모드: 게시글 원본 데이터(스토어) */
  const postFromStore = useSelector(state =>
    postId ? state.memory?.postsById?.[postId] : null,
  );

  /** -----------------------------
   * ✅ 수정모드면 post fetch
   * ---------------------------- */
  useEffect(() => {
    if (!isEditMode) return;
    if (!postId) return;
    if (!postFromStore) dispatch(fetchPostByIdThunk(postId));
  }, [dispatch, isEditMode, postId, postFromStore]);

  /** -----------------------------
   * ✅ 초기값(글/미디어) 세팅
   * - 사용자가 이미 입력/수정 시작했으면 덮어쓰지 않기
   * ---------------------------- */
  const didInitTextRef = useRef(false);
  const didInitMediaRef = useRef(false);

  /** state */
  const [text, setText] = useState(initialContent || '');
  const [isUploading, setIsUploading] = useState(false);

  // ✅ selectedImages는 수정모드에서 store 기반으로도 채워야 해서 state로 관리
  const [selectedImages, setSelectedImages] = useState(initImages ?? []);

  // ✅ CategorySelectScreen에서 넘어온 category가 최우선
  const selectedCategory = routeSelectedCategory;

  // ✅ removedUrls는 filename 기준 비교가 안전해서 미리 정규화
  const removedFileNameSet = useMemo(() => {
    return new Set(
      (removedUrlsFromRoute || [])
        .map(u => extractFileNameFromUrl(u))
        .filter(Boolean),
    );
  }, [removedUrlsFromRoute]);

  // ✅ 글 내용 초기 세팅(수정모드)
  useEffect(() => {
    if (!isEditMode) return;
    if (didInitTextRef.current) return;

    const fallback = postFromStore?.content ?? '';
    if (!initialContent && fallback) {
      setText(fallback);
    }

    didInitTextRef.current = true;
  }, [isEditMode, postFromStore, initialContent]);

  // ✅ 미디어 초기 세팅(수정모드)
  useEffect(() => {
    if (!isEditMode) return;
    if (didInitMediaRef.current) return;

    // route로 넘어온 initImages가 있으면 그걸 우선 사용
    if (Array.isArray(initImages) && initImages.length > 0) {
      setSelectedImages(initImages);
      didInitMediaRef.current = true;
      return;
    }

    // initImages가 없으면 postFromStore에서 기존 미디어로 채움
    const urls = postFromStore?.imageUrls || postFromStore?.mediaUrls || [];
    const types = postFromStore?.postTypes || postFromStore?.mediaTypes || [];

    if (Array.isArray(urls) && urls.length > 0) {
      const merged = urls
        .map((u, idx) => {
          const raw = String(u || '');
          if (!raw) return null;

          // removedUrls 제외(파일명 기준)
          const fileName = extractFileNameFromUrl(raw) || raw;
          if (removedFileNameSet.has(fileName)) return null;

          const hintType = types?.[idx];
          if (hintType === 'video' || hintType === 'VIDEO') {
            return {uri: raw, isRemote: true, isVideo: true};
          }

          return raw;
        })
        .filter(Boolean);

      setSelectedImages(merged);
    }

    didInitMediaRef.current = true;
  }, [isEditMode, initImages, postFromStore, removedFileNameSet]);

  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = useCallback(msg => {
    setToastMessage(msg);
    setToastVisible(true);
  }, []);

  /* =========================
   * ✅ MediaViewer state
   * ========================= */

  const [viewerIndex, setViewerIndex] = useState(null);

  const viewerMedia = useMemo(() => {
    return (selectedImages || []).map(it => ({
      uri: typeof it === 'string' ? it : it?.uri || it?.path,
      type:
        (typeof it === 'string'
          ? (() => {
              const raw = String(it).split('?')[0];
              const ext = raw.split('.').pop()?.toLowerCase();
              return ext === 'mp4' || ext === 'mov' ? 'video' : 'photo';
            })()
          : it?.isVideo
          ? 'video'
          : 'photo') || 'photo',
    }));
  }, [selectedImages]);

  /* =========================
   * helpers
   * ========================= */

  const getItemUri = useCallback(item => {
    return typeof item === 'string' ? item : item?.uri || item?.path;
  }, []);

  const getExtFromUri = useCallback(uriOrObj => {
    const uri =
      typeof uriOrObj === 'string'
        ? uriOrObj
        : uriOrObj?.uri || uriOrObj?.path || '';
    const raw = String(uri).split('?')[0];
    const ext = raw.split('.').pop()?.toLowerCase();
    return ext || 'jpg';
  }, []);

  const inferContentTypeByExt = useCallback(ext => {
    const e = (ext || '').toLowerCase();
    if (e === 'jpg' || e === 'jpeg') return 'image/jpeg';
    if (e === 'png') return 'image/png';
    if (e === 'webp') return 'image/webp';
    if (e === 'mp4') return 'video/mp4';
    if (e === 'mov') return 'video/quicktime';
    return 'application/octet-stream';
  }, []);

  const inferPostType = useCallback(ext => {
    const e = (ext || '').toLowerCase();
    if (e === 'mp4' || e === 'mov') return 'video';
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

  const isRemoteItem = useCallback(
    item => {
      if (typeof item === 'string') return isHttpUrl(item);
      if (item?.isRemote === true) return true;
      const uri = getItemUri(item);
      return isHttpUrl(uri);
    },
    [getItemUri],
  );

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

      // ✅ 원격은 압축/업로드 대상 아님(수정모드에서 기존 미디어)
      if (isRemoteItem(item)) {
        const ext = getExtFromUri(uri) || (isVideoItem(item) ? 'mp4' : 'jpg');
        return {uri, ext, skipUpload: true};
      }

      // ✅ 영상 압축
      if (isVideoItem(item)) {
        const compressedUri = await VideoCompressor.compress(uri, {
          compressionMethod: 'auto',
          minimumFileSizeForCompress: 5,
        });

        const ext = getExtFromUri(compressedUri) || 'mp4';
        return {uri: compressedUri, ext, skipUpload: false};
      }

      // ✅ 이미지 압축
      const compressedUri = await ImageCompressor.compress(uri, {
        compressionMethod: 'auto',
        quality: 0.8,
      });
      const ext = getExtFromUri(compressedUri) || 'jpg';
      return {uri: compressedUri, ext, skipUpload: false};
    },
    [getItemUri, getExtFromUri, isVideoItem, isRemoteItem],
  );

  /* =========================
   * upload / update
   * ========================= */

  const handleUpload = useCallback(async () => {
    if (isUploading) return;

    const authorId = userId;

    console.log('[STEP 0] start', {
      isEditMode,
      postId,
      familyId,
      authorId,
      selectedCount: selectedImages.length,
      removedCount: removedUrlsFromRoute?.length || 0,
    });

    if (!selectedCategory) {
      showToast('카테고리를 먼저 선택해 주세요.');
      return;
    }
    if (!familyId || !authorId) {
      showToast('로그인 정보를 확인해 주세요.');
      return;
    }
    if (isEditMode && !postId) {
      showToast('수정할 게시글 정보를 찾지 못했어요.');
      return;
    }

    try {
      setIsUploading(true);

      console.log('✅ [STEP 1] category 준비');

      /** 1) 카테고리(임시면 생성) */
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

      console.log('✅ [STEP 1 DONE] finalCategoryId:', finalCategoryId);
      console.log('✅ [STEP 2] media 준비');

      /** 2) selectedImages 순서를 그대로 유지하면서 */
      const now = Date.now();

      const localUploadJobs = [];
      const finalMedia = []; // {fileName, postType}

      for (let i = 0; i < selectedImages.length; i++) {
        const item = selectedImages[i];
        const rawUri = getItemUri(item);

        if (!rawUri) {
          showToast('파일 경로를 불러오지 못했어요.');
          return;
        }

        // ✅ 기존(remote) 처리
        if (isRemoteItem(item)) {
          const fileName = extractFileNameFromUrl(rawUri);
          if (!fileName) {
            showToast('기존 미디어 정보를 읽지 못했어요.');
            return;
          }
          const ext = getExtFromUri(fileName) || getExtFromUri(rawUri);
          finalMedia.push({fileName, postType: inferPostType(ext)});
          continue;
        }

        // ✅ 신규(local) 처리 (압축 후 업로드)
        const {uri: compressedUri, ext, skipUpload} =
          await compressIfNeeded(item);

        if (!compressedUri || skipUpload) {
          showToast('파일 준비 중 오류가 발생했어요.');
          return;
        }

        const fileName = `media_${now}_${i}.${ext}`;
        const contentType = inferContentTypeByExt(ext);
        const postType = inferPostType(ext);

        localUploadJobs.push({
          orderIndex: i,
          uri: compressedUri,
          fileName,
          contentType,
          postType,
        });

        finalMedia.push(null);
      }

      console.log('✅ [STEP 2 DONE] localUploadJobs:', localUploadJobs.length);
      console.log('✅ [STEP 3] presigned 요청');

      // ✅ presigned + upload (로컬만)
      if (localUploadJobs.length > 0) {
        const presignedUrls = await getPresignedUrls(
          localUploadJobs.map(f => ({
            fileName: f.fileName,
            contentType: f.contentType,
          })),
        );

        console.log('✅ [STEP 3 DONE] presignedUrls:', presignedUrls.length);
        console.log('✅ [STEP 4] S3 upload');

        for (let i = 0; i < localUploadJobs.length; i++) {
          const job = localUploadJobs[i];
          await uploadFileToS3(
            presignedUrls[i],
            job.uri,
            job.contentType,
            job.fileName,
          );

          finalMedia[job.orderIndex] = {
            fileName: job.fileName,
            postType: job.postType,
          };
        }

        console.log('✅ [STEP 4 DONE] S3 upload 완료');
      }

      const normalizedFinalMedia = finalMedia.filter(Boolean);
      const imageUrls = normalizedFinalMedia.map(m => m.fileName);
      const postTypes = normalizedFinalMedia.map(m => m.postType);

      console.log('✅ [STEP 4.5] final payload media', {
        imageUrlsLen: imageUrls.length,
        postTypesLen: postTypes.length,
        postTypes,
      });

      /** 3) removedUrls fileName 정규화 */
      const removedFileNames = (removedUrlsFromRoute || [])
        .map(u => extractFileNameFromUrl(u))
        .filter(Boolean);

      /** ✅ 3.5) 수정모드면 삭제된 이미지를 서버에서 먼저 삭제 */
      if (isEditMode && removedFileNames.length > 0) {
        console.log('✅ [STEP 5] removed 삭제 시작:', removedFileNames);

        for (const fileName of removedFileNames) {
          try {
            const action = await dispatch(
              deletePostImageThunk({
                postId,
                imageUrl: fileName,
                familyId,
                refresh: false,
              }),
            );

            if (action?.meta?.requestStatus === 'rejected') {
              console.log('❌ deletePostImageThunk rejected:', action);
              showToast('삭제 처리 중 오류가 발생했어요.');
              return;
            }
          } catch (e) {
            logAxiosError('STEP 5 deletePostImageThunk', e);
            showToast('삭제 처리 중 오류가 발생했어요.');
            return;
          }
        }

        console.log('✅ [STEP 5 DONE] removed 삭제 완료');
      }

      /** 4) API 호출 */
      console.log('✅ [STEP 6] API 호출');

      if (isEditMode) {
        const payload = {
          authorId,
          content: text || '',
          familyId,
          categoryId: finalCategoryId,
          imageUrls,
          postTypes,
        };

        console.log('✅ [STEP 6-EDIT] update payload', payload);

        try {
          await updatePostApi(postId, payload);
        } catch (e) {
          logAxiosError('STEP 6 updatePostApi', e);
          showToast('수정 요청 중 서버 오류가 발생했어요.');
          return;
        }
      } else {
        const payload = {
          authorId,
          content: text || '',
          familyId,
          categoryId: finalCategoryId,
          imageUrls,
          postTypes,
        };

        console.log('✅ [STEP 6-CREATE] upload payload', payload);

        try {
          await uploadPostApi(payload);
        } catch (e) {
          logAxiosError('STEP 6 uploadPostApi', e);
          showToast('업로드 요청 중 서버 오류가 발생했어요.');
          return;
        }
      }

      setSuccessModalVisible(true);
    } catch (e) {
      logAxiosError('handleUpload OUTER', e);
      showToast('업로드 중 오류가 발생했어요.');
    } finally {
      setIsUploading(false);
    }
  }, [
    isUploading,
    selectedCategory,
    selectedImages,
    text,
    familyId,
    userId,
    dispatch,
    showToast,
    inferContentTypeByExt,
    inferPostType,
    compressIfNeeded,
    getItemUri,
    getExtFromUri,
    isRemoteItem,
    isEditMode,
    postId,
    removedUrlsFromRoute,
  ]);

  /* =========================
   * header
   * ========================= */

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Text style={styles.headerText}>
          {isEditMode ? '게시글 수정' : '글쓰기'}
        </Text>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={handleUpload}
          disabled={isUploading}
          style={[styles.headerRightBtn, isUploading && {opacity: 0.4}]}
          activeOpacity={0.85}>
          <Image
            source={require('../../../assets/icons/check.png')}
            style={styles.checkIcon}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleUpload, isUploading, isEditMode]);

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

              if (isVideo && uri && !thumbUri) {
                requestAnimationFrame(() => ensureVideoThumb(item));
              }

              return (
                <Pressable
                  key={(uri || 'unknown') + index}
                  style={styles.gridImageWrapper}
                  onPress={() => {
                    // ✅ gridImages index -> selectedImages 실제 index로 변환
                    const realIndex = index; // gridImages는 앞에서 slice(0,3)라서 0~2는 동일
                    setViewerIndex(realIndex);
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
          onChangeText={v => {
            didInitTextRef.current = true;
            setText(v);
          }}
          placeholder="글로 남긴 추억은 더 생생해요"
          placeholderTextColor="#999"
        />

        {/* ✅ MediaViewer (ImageSelectPage와 동일) */}
        <MediaViewer
          visible={viewerIndex !== null}
          media={viewerMedia}
          index={viewerIndex ?? 0}
          onIndexChange={idx => setViewerIndex(idx)}
          onClose={() => setViewerIndex(null)}
        />

        <ToastModal
          visible={successModalVisible}
          message={isEditMode ? '게시글을 수정했어요' : '게시글을 업로드했어요'}
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
    color: HEADER_STYLES.defaultTitleFontColor,
    lineHeight: getResponsiveHeight(26),
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  checkIcon: {
    width: HEADER_STYLES.headerRightIconWidth,
    height: HEADER_STYLES.headerRightIconHeight,
    marginRight: HEADER_STYLES.headerRightIconRightPadding,
    resizeMode: 'contain',
  },
  headerRightBtn: {
    paddingVertical: getResponsiveHeight(6),
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
    fontFamily:'Pretendard-Medium',
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
});
