/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/no-unstable-nested-components */

// src/features/post/screens/PostPage.jsx
import React, {useEffect, useMemo, useRef, useCallback, useState} from 'react';
import {View, Text, TouchableOpacity, Image, StyleSheet, ScrollView, Pressable} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';

import BottomSheet, {BottomSheetBackdrop} from '@gorhom/bottom-sheet';
import LinearGradient from 'react-native-linear-gradient';

import {fetchPostByIdThunk} from '../store/memoryThunk';
import {setMemorySelectedTab} from '../store/memorySlice';
import {fetchCategoryThunk} from '../store/categoryThunk';
import {deleteCommentThunk} from '../store/commentThunk';

import useHideTabBar from 'hooks/useHideTabBar';
import usePostPageViewModel from '../hooks/usePostPageViewModel';

import ImageCarousel from '../components/ImageCarousel';
import MemoryDetailBottomSheet from '../components/MemoryDetailBottomSheet';
import ToastModal from 'components/modal/ToastModal';
import ImageDeleteModal from '../components/DeleteOptionModal';
import PostOptionsMenu from '../components/PostOptionMenu';

import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from 'utils/responsive';

// 분리 훅들
import usePostHeaderOptions from '../hooks/usePostHeaderOptions';
import usePostMediaSaver from '../hooks/usePostMediaSaver';
import usePostConfirmDelete from '../hooks/usePostConfirmDelete';
import usePostDescSheet from '../hooks/usePostDescSheet';
import usePostCommentSheet from '../hooks/usePostCommentSheet';

export default function PostPage({route}) {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const descSheetRef = useRef(null);
  const commentSheetRef = useRef(null);
  const didInitIndexRef = useRef(false);
  const isLeavingRef = useRef(false);

  const {postId, imageIndex = 0} = route?.params || {};
  const familyId = useSelector(s => s.family?.familyId);

  const postFromStore = useSelector(state =>
    postId ? state.memory?.postsById?.[String(postId)] : null,
  );
  const categoryList = useSelector(state => state.category?.categoryList || []);

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

  const toast = useCallback(
    msg => {
      vm.setToastMessage?.(msg);
      vm.setToastVisible?.(true);
    },
    [vm],
  );

 /** ---------------- 크롬 토글 ---------------- */
  const [isChromeHidden, setIsChromeHidden] = useState(false);

 /** ---------------- 옵션 메뉴 ---------------- */
  const [menuVisible, setMenuVisible] = useState(false);
  const menuRef = useRef(null);
  const closeMenu = useCallback(() => menuRef.current?.close?.(), []);

 /** ---------------- headerCategoryTitle (훅 인자로 넣기 전에 먼저 계산!) ---------------- */
  const headerCategoryTitle = useMemo(() => {
    const cid = safeMemory?.categoryId;
    if (!cid) return '게시물';

    const list = Array.isArray(categoryList) ? categoryList : [];
    const matched = list.find(c => String(c?.categoryId) === String(cid));
    return matched?.title || matched?.name || '게시물';
  }, [categoryList, safeMemory?.categoryId]);

 /** ---------------- desc sheet 분리 ---------------- */
  const {
    descIndex,
    descExpanded,
    descSnapPoints,
    showDescSheet,
    toggleDescByClick,
    collapseDesc,
    syncDescOnLoaded,
    onDescSheetChange,
    lastDescIndexRef,
  } = usePostDescSheet({
    isChromeHidden,
    isLeavingRef,
    isImageFullScreen: vm.isImageFullScreen,
    descSheetRef,
  });

 /** ---------------- comment sheet 분리 ---------------- */
  const {
    commentOpenRef,
    presentingCommentRef,
    openCommentSheet,
    cleanupCommentTimers,
    onCommentSheetChange,
  } = usePostCommentSheet({
    isChromeHidden,
    isLeavingRef,
    menuVisible,
    closeMenu,
    collapseDesc,
    commentSheetRef,
  });

 /** ---------------- 삭제 confirm 분리 ---------------- */
  const {
    confirmVisible,
    pendingDeleteType,
    isConfirmDeleting,
    openDeleteCommentConfirm,
    closeConfirmModal,
    confirmDelete,
    openDeleteImageConfirm,
    openDeletePostConfirm,
  } = usePostConfirmDelete({
    postId,
    dispatch,
    vm,
    toast,
    deleteCommentThunk,
  });

 /** ---------------- 저장 로직 분리 (훅 내부 busy만 사용하도록 정리) ---------------- */
  const {isOptionBusy, saveOneToGallery, saveAllToGallery} = usePostMediaSaver({toast});

 /** ---------------- 현재 미디어 helper ---------------- */
  const currentMediaUri = useMemo(() => {
    const list = Array.isArray(vm.localImages) ? vm.localImages : [];
    const idx = Number.isInteger(vm.currentImageIndex) ? vm.currentImageIndex : 0;
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

 /** ---------------- fetch ---------------- */
  useEffect(() => {
    if (postId && !postFromStore) dispatch(fetchPostByIdThunk(postId));
  }, [postId, postFromStore, dispatch]);

  useEffect(() => {
    if (didInitIndexRef.current) return;
    if (Number.isFinite(imageIndex)) vm.setCurrentImageIndex(imageIndex);
    didInitIndexRef.current = true;
  }, [imageIndex, vm]);

  useEffect(() => {
    if (!categoryList?.length && familyId) dispatch(fetchCategoryThunk(familyId));
  }, [categoryList?.length, familyId, dispatch]);

 /** 데이터 로드 후 desc 기본값 0 동기화 */
  useEffect(() => {
    if (!postFromStore) return;
    if (vm.isImageFullScreen) return;
    syncDescOnLoaded();
  }, [postFromStore, vm.isImageFullScreen, syncDescOnLoaded]);

 /** 풀스크린 진입 시 desc 닫기 (안전) */
  useEffect(() => {
    if (!vm.isImageFullScreen) return;
 // desc는 showDescSheet 조건에서 언마운트 되지만,
 // 상태가 남는 걸 방지하려고 최소 collapse 해둠
    collapseDesc();
  }, [vm.isImageFullScreen, collapseDesc]);

 /** ---------------- focus/blur 정리 ---------------- */
  useFocusEffect(
    useCallback(() => {
      isLeavingRef.current = false;
      return () => {
        isLeavingRef.current = true;

        cleanupCommentTimers();
        closeMenu();

        commentOpenRef.current = false;
        presentingCommentRef.current = false;

 // desc도 초기화 성격으로 닫아주기
        try {
          descSheetRef.current?.snapToIndex?.(0);
        } catch {}
        lastDescIndexRef.current = 0;
      };
    }, [
      cleanupCommentTimers,
      closeMenu,
      commentOpenRef,
      presentingCommentRef,
      lastDescIndexRef,
    ]),
  );

 /** ---------------- 헤더 옵션 분리 ---------------- */
  usePostHeaderOptions({
    navigation,
    isChromeHidden,
    isLeavingRef,
    headerCategoryTitle,
    isOptionBusy,
    menuVisible,
    setMenuVisible,
    closeMenu,
  });

 /** ---------------- 액션들 ---------------- */
  const actionSaveCurrent = useCallback(() => {
    saveOneToGallery(currentMediaUri);
  }, [saveOneToGallery, currentMediaUri]);

  const actionSaveAll = useCallback(() => {
    saveAllToGallery(allMediaUris);
  }, [saveAllToGallery, allMediaUris]);

  const actionEditPost = useCallback(() => {
    if (vm.isImageFullScreen) return;
    if (!postId) return;
    navigation.navigate('이미지선택화면', {postId, mode: '수정'});
  }, [navigation, postId, vm.isImageFullScreen]);

  const handleSwipeFromFirstToRight = useCallback(() => {
    if (vm.isImageFullScreen) return;
    dispatch(setMemorySelectedTab('post'));
    navigation.goBack();
  }, [dispatch, navigation, vm.isImageFullScreen]);

 /** 화면(이미지) 탭: 헤더+desc 동시에 토글 */
  const toggleChrome = useCallback(() => {
    setIsChromeHidden(prev => {
      const next = !prev;

      if (next) {
 // 숨김으로 갈 때: 메뉴 닫고 댓글 닫기
        if (menuVisible) closeMenu();
        try {
          commentSheetRef.current?.dismiss?.();
        } catch {}
        commentOpenRef.current = false;
        presentingCommentRef.current = false;
      } else {
 // 다시 보일 때: desc를 마지막 상태로 복원(가능하면)
        requestAnimationFrame(() => {
          try {
            const idx = lastDescIndexRef.current ?? 0;
            descSheetRef.current?.snapToIndex?.(idx);
          } catch {}
        });
      }

      return next;
    });
  }, [
    menuVisible,
    closeMenu,
    commentSheetRef,
    commentOpenRef,
    presentingCommentRef,
    lastDescIndexRef,
  ]);

  if (!postFromStore) return <SafeAreaView edges={[]} style={styles.loadingContainer} />;

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

  const canSaveCurrent = Boolean(currentMediaUri);
  const canSaveAll = Boolean(mediaCount);
  const canDeleteCurrent = Boolean(!vm.isImageFullScreen && currentMediaUri);

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
        onDeleteCurrentImage={openDeleteImageConfirm}
        onDeletePost={openDeletePostConfirm}
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
            style={styles.headerGradient}
          />
        )}
      </View>

      {showDescSheet && (
        <BottomSheet
          ref={descSheetRef}
          index={descIndex}
          snapPoints={descSnapPoints}
          enableContentPanningGesture={false}
          enableHandlePanningGesture={false}
          handleIndicatorStyle={{backgroundColor: 'transparent'}}
          backgroundStyle={{backgroundColor: 'transparent'}}
          onChange={onDescSheetChange}
          backdropComponent={props => (
            <BottomSheetBackdrop
              {...props}
              appearsOnIndex={1}
              disappearsOnIndex={0}
              opacity={0.25}
              pressBehavior="none"
              onPress={collapseDesc}
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

                <Text allowFontScaling={false} style={styles.author} numberOfLines={1}>
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

              <ScrollView scrollEnabled={descExpanded} showsVerticalScrollIndicator={false}>
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
        snapPoints={['68%']}
        myUserId={vm.user?.userId}
        onSheetChange={onCommentSheetChange}
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
  loadingContainer: {flex: 1, backgroundColor: '#000'},

  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: getResponsiveHeight(120),
    zIndex: 5,
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
