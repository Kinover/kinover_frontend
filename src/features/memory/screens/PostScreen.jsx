/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/no-unstable-nested-components */

// src/features/post/screens/PostPage.jsx

import React, {useEffect, useRef, useMemo, useCallback, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  ScrollView,
  Pressable,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';

import BottomSheet, {BottomSheetBackdrop} from '@gorhom/bottom-sheet';
import LinearGradient from 'react-native-linear-gradient';

import RNBlobUtil from 'react-native-blob-util';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';

import {fetchPostByIdThunk} from '../store/memoryThunk';
import {setMemorySelectedTab} from '../store/memorySlice';

import useHideTabBar from '../../../hooks/useHideTabBar';
import usePostPageViewModel from '../hooks/usePostPageViewModel';

import ImageCarousel from '../components/ImageCarousel';
import MemoryDetailBottomSheet from '../components/MemoryDetailBottomSheet';
import ToastModal from '../../../components/modal/ToastModal';

import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from '../../../utils/responsive';
import {HEADER_STYLES} from 'styles/style';

import ImageDeleteModal from '../components/DeleteOptionModal';
import {deleteCommentThunk} from '../store/commentThunk';

import PostOptionsMenu from '../components/PostOptionMenu';
import {fetchCategoryThunk} from '../store/categoryThunk';

const {width: SCREEN_W} = Dimensions.get('window');

export default function PostPage({route}) {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const descSheetRef = useRef(null);
  const commentSheetRef = useRef(null);
  const didInitIndexRef = useRef(false);

  const isLeavingRef = useRef(false);

  const commentOpenRef = useRef(false);
  const presentingCommentRef = useRef(false);
  const commentOpenTimerRef = useRef(null);

  // ✅ desc index는 0(기본) / 1(확장)만 유지 (숨김은 "언마운트"로 해결)
  const [descIndex, setDescIndex] = useState(0);
  const lastDescIndexRef = useRef(0);

  const {postId, imageIndex = 0} = route?.params || {};
  const familyId = useSelector(s => s.family?.familyId);

  const postFromStore = useSelector(state =>
    postId ? state.memory?.postsById?.[String(postId)] : null,
  );

  const categoryList = useSelector(state => state.category?.categoryList || []);
  const fromNotificationReset = Boolean(route?.params?._fromNotificationReset);

  const safeMemory = useMemo(
    () => ({
      postId,
      authorName: '',
      authorImage: null,
      content: '',
      ...(postFromStore || {}),
    }),
    [postFromStore, postId],
  );

  const vm = usePostPageViewModel(safeMemory);
  useHideTabBar();

  const [descExpanded, setDescExpanded] = useState(false);

  // ✅ 화면 탭으로 헤더 + desc 같이 숨김/복원
  const [isChromeHidden, setIsChromeHidden] = useState(false);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingDeleteType, setPendingDeleteType] = useState(null);
  const [pendingCommentId, setPendingCommentId] = useState(null);
  const [isConfirmDeleting, setIsConfirmDeleting] = useState(false);

  const [isOptionBusy, setIsOptionBusy] = useState(false);

  /** ---------------- 토스트 helper ---------------- */
  const toast = useCallback(
    msg => {
      vm.setToastMessage?.(msg);
      vm.setToastVisible?.(true);
    },
    [vm],
  );

  /** ---------------- 현재 미디어 helper ---------------- */
  const currentMediaUri = useMemo(() => {
    const list = Array.isArray(vm.localImages) ? vm.localImages : [];
    const idx = Number.isInteger(vm.currentImageIndex)
      ? vm.currentImageIndex
      : 0;
    return list[idx] || null;
  }, [vm.localImages, vm.currentImageIndex]);

  const allMediaUris = useMemo(() => {
    const list = Array.isArray(vm.localImages) ? vm.localImages : [];
    return list.filter(Boolean);
  }, [vm.localImages]);

  const mediaCount = allMediaUris.length;

  const currentLabel = useMemo(() => {
    const i = Number.isInteger(vm.currentImageIndex) ? vm.currentImageIndex : 0;
    const total = Math.max(mediaCount, 1);
    return `${Math.min(i + 1, total)}/${total}`;
  }, [vm.currentImageIndex, mediaCount]);

  /** ---------------- 옵션 메뉴 ---------------- */
  const [menuVisible, setMenuVisible] = useState(false);
  const menuRef = useRef(null);

  const closeMenu = useCallback(() => {
    menuRef.current?.close?.();
  }, []);

  /** ---------------- desc ---------------- */
  const descSnapPoints = useMemo(() => ['20%', '30%'], []);

  const setDescToIndex = useCallback(
    nextIndex => {
      if (isChromeHidden) return;
      if (isLeavingRef.current) return;
      if (vm.isImageFullScreen) return;
      if (commentOpenRef.current) return;

      const idx = nextIndex === 1 ? 1 : 0;
      lastDescIndexRef.current = idx;

      setDescIndex(idx);
      setDescExpanded(idx === 1);

      requestAnimationFrame(() => {
        descSheetRef.current?.snapToIndex?.(idx);
      });
    },
    [isChromeHidden, vm.isImageFullScreen],
  );

  const toggleDescByClick = useCallback(() => {
    if (vm.isImageFullScreen) return;
    if (isChromeHidden) return;
    if (isLeavingRef.current) return;

    setDescToIndex(descIndex === 0 ? 1 : 0);
  }, [descIndex, isChromeHidden, setDescToIndex, vm.isImageFullScreen]);

  const collapseDesc = useCallback(() => {
    setDescToIndex(0);
  }, [setDescToIndex]);

  /** ---------------- comment sheet ---------------- */
  const openCommentSheet = useCallback(() => {
    if (isChromeHidden) return;
    if (isLeavingRef.current) return;

    if (menuVisible) closeMenu();

    if (commentOpenRef.current) return;
    if (presentingCommentRef.current) return;

    collapseDesc();

    if (commentOpenTimerRef.current) {
      clearTimeout(commentOpenTimerRef.current);
      commentOpenTimerRef.current = null;
    }

    presentingCommentRef.current = true;

    commentOpenTimerRef.current = setTimeout(() => {
      commentOpenTimerRef.current = null;

      if (isLeavingRef.current) {
        presentingCommentRef.current = false;
        return;
      }

      commentSheetRef.current?.present?.();
    }, 120);
  }, [collapseDesc, isChromeHidden, menuVisible, closeMenu]);

  // ✅ 풀스크린 진입 시 commentSheet 닫기
  useEffect(() => {
    if (!vm.isImageFullScreen) return;
    try {
      commentSheetRef.current?.dismiss?.();
    } catch {}
  }, [vm.isImageFullScreen]);

  /** ---------------- focus/blur 정리 ---------------- */
  const cleanupOnLeave = useCallback(() => {
    if (commentOpenTimerRef.current) {
      clearTimeout(commentOpenTimerRef.current);
      commentOpenTimerRef.current = null;
    }

    try {
      commentSheetRef.current?.dismiss?.();
    } catch {}

    try {
      if (menuVisible) closeMenu();
    } catch {}

    commentOpenRef.current = false;
    presentingCommentRef.current = false;

    // desc 상태도 정리
    setDescIndex(0);
    setDescExpanded(false);
    lastDescIndexRef.current = 0;
  }, [closeMenu, menuVisible]);

  useFocusEffect(
    useCallback(() => {
      isLeavingRef.current = false;

      return () => {
        isLeavingRef.current = true;
        cleanupOnLeave();
      };
    }, [cleanupOnLeave]),
  );

  /** ---------------- fetch ---------------- */
  useEffect(() => {
    if (postId && !postFromStore) {
      dispatch(fetchPostByIdThunk(postId));
    }
  }, [postId, postFromStore, dispatch]);

  useEffect(() => {
    if (didInitIndexRef.current) return;
    if (Number.isFinite(imageIndex)) {
      vm.setCurrentImageIndex(imageIndex);
    }
    didInitIndexRef.current = true;
  }, [imageIndex, vm]);

  useEffect(() => {
    if (!categoryList?.length && familyId) {
      dispatch(fetchCategoryThunk(familyId));
    }
  }, [categoryList?.length, familyId, dispatch]);

  /** ---------------- 삭제 confirm ---------------- */
  const openDeleteCommentConfirm = useCallback(commentId => {
    setPendingDeleteType('comment');
    setPendingCommentId(commentId);
    setConfirmVisible(true);
  }, []);

  const closeConfirmModal = useCallback(() => {
    if (isConfirmDeleting) return;
    setConfirmVisible(false);
    setPendingDeleteType(null);
    setPendingCommentId(null);
  }, [isConfirmDeleting]);

  const confirmDelete = useCallback(async () => {
    if (!pendingDeleteType || isConfirmDeleting) return;

    setIsConfirmDeleting(true);
    try {
      if (pendingDeleteType === 'image') {
        await vm.handleDeleteImage?.();
      } else if (pendingDeleteType === 'post') {
        await vm.handleDeletePost?.();
      } else if (pendingDeleteType === 'comment') {
        if (pendingCommentId && postId) {
          await dispatch(deleteCommentThunk(pendingCommentId, postId));
          toast('댓글을 삭제했어요');
        }
      }
    } finally {
      setIsConfirmDeleting(false);
      setConfirmVisible(false);
      setPendingDeleteType(null);
      setPendingCommentId(null);
    }
  }, [
    pendingDeleteType,
    isConfirmDeleting,
    vm,
    pendingCommentId,
    dispatch,
    postId,
    toast,
  ]);

  /** ---------------- 저장 로직 ---------------- */
  const ensureAndroidSavePermission = useCallback(async () => {
    if (Platform.OS !== 'android') return true;

    try {
      if (Platform.Version >= 33) {
        const r1 = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
        );

        let r2 = PermissionsAndroid.RESULTS.GRANTED;
        try {
          r2 = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
          );
        } catch {
          r2 = PermissionsAndroid.RESULTS.GRANTED;
        }

        return (
          r1 === PermissionsAndroid.RESULTS.GRANTED &&
          r2 === PermissionsAndroid.RESULTS.GRANTED
        );
      }

      const r = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      );
      return r === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return true;
    }
  }, []);

  const inferExt = useCallback(uri => {
    try {
      const clean = String(uri || '').split('?')[0];
      const ext = clean.split('.').pop()?.toLowerCase();
      if (!ext || ext.includes('/') || ext.length > 6) return 'jpg';
      if (ext === 'jpeg') return 'jpg';
      return ext;
    } catch {
      return 'jpg';
    }
  }, []);

  const downloadToLocalFile = useCallback(async (urlOrUri, extGuess = 'jpg') => {
    const src = String(urlOrUri || '');
    if (!src) throw new Error('empty uri');

    if (src.startsWith('file://')) {
      return src.replace('file://', '');
    }

    const safeExt = extGuess || 'jpg';
    const dest = `${
      RNBlobUtil.fs.dirs.CacheDir
    }/kino_save_${Date.now()}_${Math.random()
      .toString(16)
      .slice(2)}.${safeExt}`;

    const res = await RNBlobUtil.config({path: dest, fileCache: true}).fetch(
      'GET',
      src,
    );

    const p = res?.path?.() || dest;
    const exists = await RNBlobUtil.fs.exists(p);
    if (!exists) throw new Error('download failed');
    return p;
  }, []);

  const saveOneToGallery = useCallback(
    async uri => {
      if (!uri) {
        toast('저장할 미디어가 없어요.');
        return;
      }
      if (!CameraRoll) {
        toast('저장 기능을 쓰려면 CameraRoll 패키지가 필요해요.');
        return;
      }

      const okPerm = await ensureAndroidSavePermission();
      if (!okPerm) {
        toast('갤러리 저장 권한이 필요해요.');
        return;
      }

      setIsOptionBusy(true);
      try {
        const ext = inferExt(uri);
        const localPath = await downloadToLocalFile(uri, ext);
        const saved = await CameraRoll.save(`file://${localPath}`, {
          type: ext === 'mp4' || ext === 'mov' ? 'video' : 'photo',
        });

        if (saved) toast('갤러리에 저장했어요.');
        else toast('저장에 실패했어요.');
      } catch (e) {
        console.error('saveOneToGallery error:', e);
        toast('저장 중 오류가 발생했어요.');
      } finally {
        setIsOptionBusy(false);
      }
    },
    [toast, ensureAndroidSavePermission, downloadToLocalFile, inferExt],
  );

  const saveAllToGallery = useCallback(async () => {
    if (!CameraRoll) {
      toast('저장 기능을 쓰려면 CameraRoll 패키지가 필요해요.');
      return;
    }
    if (!allMediaUris.length) {
      toast('저장할 미디어가 없어요.');
      return;
    }

    const okPerm = await ensureAndroidSavePermission();
    if (!okPerm) {
      toast('갤러리 저장 권한이 필요해요.');
      return;
    }

    setIsOptionBusy(true);
    try {
      let okCount = 0;
      for (let i = 0; i < allMediaUris.length; i++) {
        const uri = allMediaUris[i];
        try {
          const ext = inferExt(uri);
          const localPath = await downloadToLocalFile(uri, ext);
          // eslint-disable-next-line no-await-in-loop
          const saved = await CameraRoll.save(`file://${localPath}`, {
            type: ext === 'mp4' || ext === 'mov' ? 'video' : 'photo',
          });
          if (saved) okCount += 1;
        } catch (e) {
          console.error('saveAll item error:', e);
        }
      }
      toast(`${okCount}개를 저장했어요`);
    } catch (e) {
      console.error('saveAllToGallery error:', e);
      toast('전체 저장 중 오류가 발생했어요.');
    } finally {
      setIsOptionBusy(false);
    }
  }, [
    toast,
    allMediaUris,
    ensureAndroidSavePermission,
    downloadToLocalFile,
    inferExt,
  ]);

  /** ---------------- 옵션 액션 ---------------- */
  const actionSaveCurrent = useCallback(async () => {
    await saveOneToGallery(currentMediaUri);
  }, [saveOneToGallery, currentMediaUri]);

  const actionSaveAll = useCallback(async () => {
    await saveAllToGallery();
  }, [saveAllToGallery]);

  const actionDeleteCurrentImage = useCallback(() => {
    if (vm.isImageFullScreen) return;

    if (!currentMediaUri) {
      toast('삭제할 미디어가 없어요.');
      return;
    }

    setPendingDeleteType('image');
    setPendingCommentId(null);
    setConfirmVisible(true);
  }, [vm.isImageFullScreen, currentMediaUri, toast]);

  const actionDeletePost = useCallback(() => {
    if (vm.isImageFullScreen) return;

    setPendingDeleteType('post');
    setPendingCommentId(null);
    setConfirmVisible(true);
  }, [vm.isImageFullScreen]);

  const actionEditPost = useCallback(() => {
    if (vm.isImageFullScreen) return;
    if (!postId) return;

    navigation.navigate('이미지선택화면', {postId: postId, mode: '수정'});
  }, [navigation, postId, vm.isImageFullScreen]);

  /** ---------------- header title ---------------- */
  const headerCategoryTitle = useMemo(() => {
    const cid = safeMemory?.categoryId;
    if (!cid) return '게시물';

    const list = Array.isArray(categoryList) ? categoryList : [];
    const matched = list.find(c => String(c?.categoryId) === String(cid));
    return matched?.title || matched?.name || '게시물';
  }, [categoryList, safeMemory?.categoryId]);

  /** ---------------- header ---------------- */
  useEffect(() => {
    navigation.setOptions({
      headerShown: !isChromeHidden,
      headerTransparent: true,
      headerTitle: () => (
        <Text allowFontScaling={false} style={styles.headerTitle}>
          {headerCategoryTitle}
        </Text>
      ),
      headerTitleAlign: 'center',
      headerStyle: {backgroundColor: 'transparent'},
      headerShadowVisible: false,
      headerTintColor: '#fff',
      headerBackground: () => (
        <View style={{flex: 1, backgroundColor: 'transparent'}} />
      ),
      headerLeft: () => {
        return (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{paddingHorizontal: getResponsiveWidth(13)}}>
            <Image
              source={require('../../../assets/images/leftArrow.png')}
              style={{
                width: getResponsiveIconSize(20),
                height: getResponsiveIconSize(20),
                tintColor: '#fff',
                resizeMode: 'contain',
              }}
            />
          </TouchableOpacity>
        );
      },
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            if (isChromeHidden) return;
            if (isLeavingRef.current) return;
            if (isOptionBusy) return;

            if (menuVisible) closeMenu();
            else setMenuVisible(true);
          }}
          disabled={isOptionBusy}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
          style={{opacity: isOptionBusy ? 0.5 : 1}}>
          <Image
            source={require('../../../assets/icons/List.png')}
            style={styles.headerIcon}
          />
        </TouchableOpacity>
      ),
    });
  }, [
    navigation,
    isChromeHidden,
    headerCategoryTitle,
    isOptionBusy,
    fromNotificationReset,
    menuVisible,
    closeMenu,
  ]);

  /** ✅ 데이터 로드 후 desc 기본값 0 */
  useEffect(() => {
    if (!postFromStore) return;
    if (vm.isImageFullScreen) return;

    lastDescIndexRef.current = 0;
    setDescIndex(0);
    setDescExpanded(false);

    requestAnimationFrame(() => {
      descSheetRef.current?.snapToIndex?.(0);
    });
  }, [postFromStore, vm.isImageFullScreen]);

  // ✅ 풀스크린이면 desc는 렌더 자체가 안 되게(아래 조건에서 처리)
  useEffect(() => {
    if (!vm.isImageFullScreen) return;
    setDescExpanded(false);
  }, [vm.isImageFullScreen]);

  const handleSwipeFromFirstToRight = useCallback(() => {
    if (vm.isImageFullScreen) return;
    dispatch(setMemorySelectedTab('post'));
    navigation.goBack();
  }, [dispatch, navigation, vm.isImageFullScreen]);

  /** ✅ 화면(이미지) 탭: 헤더+desc 동시에 토글 + 열려있는 UI 정리 */
  const toggleChrome = useCallback(() => {
    setIsChromeHidden(prev => {
      const next = !prev;

      if (next) {
        // 숨김으로 갈 때: 메뉴 닫고 댓글도 닫기
        if (menuVisible) closeMenu();
        try {
          commentSheetRef.current?.dismiss?.();
        } catch {}
        commentOpenRef.current = false;
        presentingCommentRef.current = false;
      } else {
        // 다시 보일 때: desc를 마지막 인덱스로 복원
        requestAnimationFrame(() => {
          const idx = lastDescIndexRef.current ?? 0;
          setDescIndex(idx);
          setDescExpanded(idx === 1);
          descSheetRef.current?.snapToIndex?.(idx);
        });
      }

      return next;
    });
  }, [menuVisible, closeMenu]);

  if (!postFromStore) return <SafeAreaView style={{flex: 1}} />;

  const confirmTitle =
    pendingDeleteType === 'image'
      ? '현재 미디어를 삭제할까요?'
      : pendingDeleteType === 'post'
      ? '게시글을 삭제할까요?'
      : '댓글을 삭제할까요?';

  const confirmMessage =
    pendingDeleteType === 'image'
      ? '삭제한 미디어는 복구할 수 없어요.'
      : pendingDeleteType === 'post'
      ? '게시글과 미디어가 모두 삭제되며 복구할 수 없어요.'
      : '삭제한 댓글은 복구할 수 없어요.';

  const disableMenu = isOptionBusy || isConfirmDeleting;

  const canSaveCurrent = Boolean(currentMediaUri && CameraRoll);
  const canSaveAll = Boolean(mediaCount && CameraRoll);
  const canDeleteCurrent = Boolean(!vm.isImageFullScreen && currentMediaUri);

  const showDescSheet = !isChromeHidden && !vm.isImageFullScreen;

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      <ImageDeleteModal
        visible={confirmVisible}
        onClose={closeConfirmModal}
        onConfirm={confirmDelete}
        title={confirmTitle}
        subText={confirmMessage}
      />

      <PostOptionsMenu
        ref={menuRef}
        visible={menuVisible}
        setVisible={setMenuVisible}
        isChromeHidden={isChromeHidden}
        disableMenu={disableMenu}
        canSaveCurrent={canSaveCurrent}
        canSaveAll={canSaveAll}
        canDeleteCurrent={canDeleteCurrent}
        currentLabel={currentLabel}
        mediaCount={mediaCount}
        onSaveCurrent={actionSaveCurrent}
        onSaveAll={actionSaveAll}
        onEditPost={actionEditPost}
        onDeleteCurrentImage={actionDeleteCurrentImage}
        onDeletePost={actionDeletePost}
      />

      <View style={{flex: 1}}>
        <ImageCarousel
          localImages={vm.localImages}
          currentIndex={vm.currentImageIndex}
          setCurrentIndex={vm.setCurrentImageIndex}
          isFullScreen={vm.isImageFullScreen}
          setIsFullScreen={vm.setIsImageFullScreen}
          onSwipeFromFirstToRight={handleSwipeFromFirstToRight}
          onSingleTap={toggleChrome}
          isChromeHidden={isChromeHidden}
        />

        {!isChromeHidden && (
          <LinearGradient
            pointerEvents="none"
            colors={[
              'rgba(18,18,18,0.6)',
              'rgba(18,18,18,0.45)',
              'rgba(18,18,18,0.25)',
              'rgba(18,18,18,0.15)',
              'rgba(18,18,18,0)',
            ]}
            locations={[0, 0.2, 0.4, 0.55, 1]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: getResponsiveHeight(120),
              zIndex: 5,
            }}
          />
        )}
      </View>

      {/* ✅ 설명 바텀시트: 크롬 숨김이면 "아예 렌더 안 함" (제일 확실) */}
      {showDescSheet && (
        <BottomSheet
          ref={descSheetRef}
          index={descIndex}
          snapPoints={descSnapPoints}
          enableContentPanningGesture={false}
          enableHandlePanningGesture={false}
          handleIndicatorStyle={{backgroundColor: 'transparent'}}
          backgroundStyle={{backgroundColor: 'transparent'}}
          onChange={index => {
            const idx = index === 1 ? 1 : 0;
            lastDescIndexRef.current = idx;
            setDescIndex(idx);
            setDescExpanded(idx === 1);
          }}
          backdropComponent={props => (
            <BottomSheetBackdrop
              {...props}
              appearsOnIndex={1}
              disappearsOnIndex={0}
              opacity={0.25}
              pressBehavior="none"
              onPress={() => {
                if (isChromeHidden) return;
                if (isLeavingRef.current) return;
                if (vm.isImageFullScreen) return;
                collapseDesc();
              }}
            />
          )}>
          <Pressable
            onPress={toggleDescByClick}
            hitSlop={{top: 16, bottom: 16, left: 16, right: 16}}
            style={styles.descTapArea}>
            <LinearGradient
              colors={[
                'rgba(18,18,18,0)',
                'rgba(18,18,18,0.2)',
                'rgba(18,18,18,0.42)',
                'rgba(18,18,18,0.6)',
                'rgba(18,18,18,0.76)',
              ]}
              locations={[0, 0.3, 0.5, 0.7, 1]}
              style={styles.descSheet}>
              <View style={styles.descHeader}>
                <Image
                  style={styles.avatar}
                  source={
                    safeMemory.authorImage
                      ? {uri: safeMemory.authorImage}
                      : require('../../../assets/images/default.png')
                  }
                />
                <Text
                  allowFontScaling={false}
                  style={styles.author}
                  numberOfLines={1}>
                  {safeMemory.authorName}
                </Text>

                <View style={{flex: 1}} />

                <TouchableOpacity
                  onPress={openCommentSheet}
                  activeOpacity={0.85}
                  style={styles.commentBtn}>
                  <Image
                    source={require('../../../assets/icons/chat.png')}
                    style={{tintColor: 'white', width: '100%', height: '100%'}}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView
                scrollEnabled={descExpanded}
                showsVerticalScrollIndicator={false}>
                <Text
                  allowFontScaling={false}
                  style={styles.descContent}
                  numberOfLines={descExpanded ? undefined : 2}>
                  {safeMemory.content}
                </Text>
              </ScrollView>
            </LinearGradient>
          </Pressable>
        </BottomSheet>
      )}

      {/* ✅ 댓글 BottomSheet */}
      <MemoryDetailBottomSheet
        sheetRef={commentSheetRef}
        memory={safeMemory}
        commentList={vm.commentList}
        user={vm.user}
        familyUsers={vm.familyUsers}
        commentText={vm.commentText}
        onChangeComment={vm.setCommentText}
        onSubmitComment={vm.handleSendComment}
        onDeleteComment={openDeleteCommentConfirm}
        snapPoints={['75%']}
        myUserId={vm.user?.userId}
        onSheetChange={index => {
          commentOpenRef.current = index >= 0;
          if (index < 0) presentingCommentRef.current = false;
        }}
        disabled={vm.isImageFullScreen || isChromeHidden}
      />

      <ToastModal
        visible={vm.toastVisible}
        message={vm.toastMessage}
        onClose={() => vm.setToastVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#000'},

  headerTitle: {
    fontSize: HEADER_STYLES().defaultTitleFontSize,
    fontFamily: HEADER_STYLES().defaultTitleFontFamily,
    color: '#fff',
    lineHeight: getResponsiveHeight(26),
    textAlign: 'center',
  },
  headerIcon: {
    width: HEADER_STYLES().headerRightIconWidth,
    height: HEADER_STYLES().headerRightIconHeight,
    resizeMode: 'contain',
    marginRight: HEADER_STYLES().headerRightIconRightPadding,
    tintColor: '#fff',
  },

  descTapArea: {flex: 1},
  descSheet: {
    flex: 1,
    paddingHorizontal: getResponsiveWidth(16),
    paddingTop: getResponsiveHeight(40),
    borderTopLeftRadius: getResponsiveWidth(22),
    borderTopRightRadius: getResponsiveWidth(22),
  },
  descHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveHeight(10),
  },
  avatar: {
    width: getResponsiveWidth(28),
    height: getResponsiveWidth(28),
    borderRadius: getResponsiveWidth(14),
  },
  author: {
    marginLeft: getResponsiveWidth(8),
    color: 'white',
    fontSize: getResponsiveFontSize(15),
    fontFamily: 'Pretendard-SemiBold',
  },
  commentBtn: {
    width: getResponsiveIconSize(22),
    height: getResponsiveIconSize(22),
  },
  descContent: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: getResponsiveFontSize(14),
    lineHeight: getResponsiveHeight(22),
    fontFamily: 'Pretendard-Medium',
  },
});
