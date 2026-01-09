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

import {BottomSheetModal, BottomSheetBackdrop} from '@gorhom/bottom-sheet';
import LinearGradient from 'react-native-linear-gradient';

import RNBlobUtil from 'react-native-blob-util';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';

import {fetchPostByIdThunk} from '../store/memoryThunk';
import {setMemorySelectedTab} from '../store/memorySlice';

import useHideTabBar from '../../../hooks/useHideTabBar';
import usePostPageViewModel from '../hooks/usePostPageViewModel';

import ImageCarousel from '../components/ImageCarousel';
import MemoryDetailBottomSheet from '../components/MemoryDetailBottomSheet';
import ToastModal from '../../../components/ToastModal';

import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from '../../../utils/responsive';
import {HEADER_STYLES} from 'styles/style';

import ImageDeleteModal from '../components/DeleteOptionModal';
import {deleteCommentThunk} from '../store/commentThunk';

// ✅ 옵션 메뉴 컴포넌트로 분리
import PostOptionsMenu from '../components/PostOptionMenu';

const {width: SCREEN_W} = Dimensions.get('window');

export default function PostPage({route}) {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const descSheetRef = useRef(null);
  const commentSheetRef = useRef(null);
  const didInitIndexRef = useRef(false);

  // ✅ descSheet 중복 present 방지
  const didPresentDescRef = useRef(false);
  // ✅ 화면 나가는 중 가드
  const isLeavingRef = useRef(false);

  const {postId, imageIndex = 0} = route?.params || {};

  const postFromStore = useSelector(state =>
    postId ? state.memory?.postsById?.[postId] : null,
  );
  const categoryList = useSelector(state => state.category.categoryList || []);

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
  const [isChromeHidden, setIsChromeHidden] = useState(false);

  // ✅ confirm 모달 상태
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingDeleteType, setPendingDeleteType] = useState(null); // 'image' | 'post' | 'comment' | null
  const [pendingCommentId, setPendingCommentId] = useState(null);
  const [isConfirmDeleting, setIsConfirmDeleting] = useState(false);

  // ✅ 옵션 로딩/중복 클릭 방지
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

  /** ---------------- “상단 우측 옵션 메뉴(팝오버)” ---------------- */
  const [menuVisible, setMenuVisible] = useState(false);

  const closeMenu = useCallback(() => {
    setMenuVisible(false);
  }, []);

  const openMenu = useCallback(() => {
    if (isChromeHidden) return;
    if (isLeavingRef.current) return;
    if (isOptionBusy) return;
    setMenuVisible(true);
  }, [isChromeHidden, isOptionBusy]);

  const toggleMenu = useCallback(() => {
    if (menuVisible) closeMenu();
    else openMenu();
  }, [menuVisible, closeMenu, openMenu]);

  /** ---------------- 모든 시트 닫기 (유령 모달 방지) ---------------- */
  const dismissAllSheets = useCallback(() => {
    try {
      commentSheetRef.current?.dismiss?.();
    } catch {
      null;
    }
    try {
      descSheetRef.current?.dismiss?.();
    } catch {
      null;
    }
    didPresentDescRef.current = false;

    // ✅ 옵션 팝오버도 같이 닫기
    try {
      if (menuVisible) closeMenu();
    } catch {
      null;
    }
  }, [closeMenu, menuVisible]);

  /** ---------------- focus/blur 시점에 정리 ---------------- */
  useFocusEffect(
    useCallback(() => {
      isLeavingRef.current = false;

      return () => {
        isLeavingRef.current = true;
        dismissAllSheets();
      };
    }, [dismissAllSheets]),
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

  /** ---------------- 댓글 삭제 모달 열기 ---------------- */
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

  const downloadToLocalFile = useCallback(
    async (urlOrUri, extGuess = 'jpg') => {
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
    },
    [],
  );

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

  // ✅ 게시글 수정 옵션 추가
  const actionEditPost = useCallback(() => {
    if (vm.isImageFullScreen) return;
    if (!postId) return;

    // ✅ 라우트 이름은 프로젝트에 맞게 바꿔줘!
    // 예) navigation.navigate('EditPostPage', {postId})
    navigation.navigate('이미지선택화면', {postId: postId, mode: '수정'});
  }, [navigation, postId, vm.isImageFullScreen]);

  /** ---------------- header (투명 헤더) ---------------- */
  useEffect(() => {
    const matched = categoryList.find(
      c => c.categoryId === safeMemory?.categoryId,
    );

    navigation.setOptions({
      headerShown: !isChromeHidden,
      headerTransparent: true,
      headerTitle: () => (
        <Text style={styles.headerTitle}>{matched?.title || '게시물'}</Text>
      ),
      headerTitleAlign: 'center',
      headerStyle: {backgroundColor: 'transparent'},
      headerShadowVisible: false,
      headerTintColor: '#fff',
      headerBackground: () => (
        <View style={{flex: 1, backgroundColor: 'transparent'}} />
      ),

      headerLeft: () => (
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
      ),

      headerRight: () => (
        <TouchableOpacity
          onPress={toggleMenu}
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
    categoryList,
    safeMemory,
    isChromeHidden,
    toggleMenu,
    isOptionBusy,
  ]);

  /** ---------------- description sheet ---------------- */
  const descSnapPoints = useMemo(() => ['20%', '30%'], []);

  const presentDescSheet = useCallback(() => {
    if (isChromeHidden) return;
    if (isLeavingRef.current) return;

    // ✅ 이미 떠 있으면 또 present 하지 않기
    if (didPresentDescRef.current) return;

    descSheetRef.current?.present?.();
    didPresentDescRef.current = true;
  }, [isChromeHidden]);

  const applyDescIndex = useCallback(
    nextExpanded => {
      if (isChromeHidden) return;
      if (isLeavingRef.current) return;

      const nextIndex = nextExpanded ? 1 : 0;

      // ✅ present는 1번만
      presentDescSheet();
      descSheetRef.current?.snapToIndex?.(nextIndex);
    },
    [isChromeHidden, presentDescSheet],
  );

  const toggleDescByClick = useCallback(() => {
    if (vm.isImageFullScreen) return;
    if (isChromeHidden) return;
    if (isLeavingRef.current) return;

    setDescExpanded(prev => {
      const next = !prev;
      applyDescIndex(next);
      return next;
    });
  }, [applyDescIndex, vm.isImageFullScreen, isChromeHidden]);

  const collapseDesc = useCallback(() => {
    setDescExpanded(false);
    applyDescIndex(false);
  }, [applyDescIndex]);

  // ✅ 초기 1회만 띄우기
  useEffect(() => {
    if (isChromeHidden) return;
    presentDescSheet();
    requestAnimationFrame(() => applyDescIndex(false));
  }, [presentDescSheet, applyDescIndex, isChromeHidden]);

  useEffect(() => {
    if (vm.isImageFullScreen) collapseDesc();
  }, [vm.isImageFullScreen, collapseDesc]);

  /** ---------------- comment sheet ---------------- */
  const openCommentSheet = useCallback(() => {
    if (isChromeHidden) return;
    if (isLeavingRef.current) return;

    // ✅ 댓글 열 때 메뉴 닫기
    if (menuVisible) closeMenu();

    collapseDesc();
    setTimeout(() => commentSheetRef.current?.present?.(), 120);
  }, [collapseDesc, isChromeHidden, menuVisible, closeMenu]);

  const handleSwipeFromFirstToRight = useCallback(() => {
    if (vm.isImageFullScreen) return;
    dispatch(setMemorySelectedTab('post'));
    navigation.goBack();
  }, [dispatch, navigation, vm.isImageFullScreen]);

  /** “한 번 탭” 토글 */
  const toggleChrome = useCallback(() => {
    setIsChromeHidden(prev => {
      const next = !prev;

      if (next) {
        // ✅ 숨길 때: 전부 닫고 presented 플래그 리셋
        dismissAllSheets();
      } else {
        // ✅ 다시 보여줄 때: desc만 1번 present
        requestAnimationFrame(() => {
          didPresentDescRef.current = false;
          presentDescSheet();
          descSheetRef.current?.snapToIndex?.(0);
        });
      }

      return next;
    });
  }, [dismissAllSheets, presentDescSheet]);

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

  // ✅ 메뉴 아이템 활성 조건
  const canSaveCurrent = Boolean(currentMediaUri && CameraRoll);
  const canSaveAll = Boolean(mediaCount && CameraRoll);
  const canDeleteCurrent = Boolean(!vm.isImageFullScreen && currentMediaUri);

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      {/* ✅ 통합 삭제 확인 모달 */}
      <ImageDeleteModal
        visible={confirmVisible}
        onClose={closeConfirmModal}
        onConfirm={confirmDelete}
        title={confirmTitle}
        subText={confirmMessage}
      />

      {/* ✅ 상단 우측 옵션 메뉴(컴포넌트 분리) */}
      <PostOptionsMenu
        visible={menuVisible}
        setVisible={setMenuVisible}
        isChromeHidden={isChromeHidden}
        disableMenu={disableMenu}
        canSaveCurrent={canSaveCurrent}
        canSaveAll={canSaveAll}
        canDeleteCurrent={canDeleteCurrent}
        currentLabel={currentLabel}
        mediaCount={mediaCount}
        onClose={closeMenu}
        onSaveCurrent={actionSaveCurrent}
        onSaveAll={actionSaveAll}
        onEditPost={actionEditPost} // ✅ 추가
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

        {/* ✅ 위 그라데이션 */}
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

      {/* ✅ 아래 설명창 */}
      {!isChromeHidden && (
        <BottomSheetModal
          ref={descSheetRef}
          snapPoints={descSnapPoints}
          handleIndicatorStyle={{backgroundColor: 'transparent'}}
          enableContentPanningGesture={false}
          enableHandlePanningGesture={false}
          enablePanDownToClose={false}
          onDismiss={() => {
            didPresentDescRef.current = false;
          }}
          backdropComponent={props => (
            <BottomSheetBackdrop
              {...props}
              appearsOnIndex={1}
              disappearsOnIndex={0}
              opacity={0.25}
              pressBehavior="none"
            />
          )}
          backgroundStyle={{backgroundColor: 'transparent'}}>
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
                <Text style={styles.author} numberOfLines={1}>
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
                  style={styles.descContent}
                  numberOfLines={descExpanded ? undefined : 2}>
                  {safeMemory.content}
                </Text>
              </ScrollView>
            </LinearGradient>
          </Pressable>
        </BottomSheetModal>
      )}

      {/* ✅ 댓글 BottomSheet */}
      {!vm.isImageFullScreen && !isChromeHidden && (
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
        />
      )}

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

  /** header */
  headerTitle: {
    fontSize: HEADER_STYLES.defaultTitleFontSize,
    fontFamily: HEADER_STYLES.defaultTitleFontFamily,
    color: '#fff',
    lineHeight: getResponsiveHeight(26),
    textAlign: 'center',
  },
  headerIcon: {
    width: HEADER_STYLES.headerRightIconWidth,
    height: HEADER_STYLES.headerRightIconHeight,
    resizeMode: 'contain',
    marginRight: HEADER_STYLES.headerRightIconRightPadding,
    tintColor: '#fff',
  },

  /** desc sheet */
  descTapArea: {
    flex: 1,
  },
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
