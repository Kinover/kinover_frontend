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
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';

import {BottomSheetModal, BottomSheetBackdrop} from '@gorhom/bottom-sheet';
import LinearGradient from 'react-native-linear-gradient';

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

// ✅ 네가 올린 모달 컴포넌트 (CustomModal 래핑)
import ImageDeleteModal from '../components/DeleteOptionModal';

// ✅ 댓글 삭제 thunk (PostPage에서 직접 호출할 거라 import)
import {deleteCommentThunk} from '../store/commentThunk';

const {height: SCREEN_HEIGHT} = Dimensions.get('window');

export default function PostPage({route}) {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const descSheetRef = useRef(null);
  const commentSheetRef = useRef(null);
  const didInitIndexRef = useRef(false);

  const {postId, imageIndex = 0} = route.params || {};

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

  // ✅ confirm 모달을 "하나"로 통합 (image/post/comment)
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingDeleteType, setPendingDeleteType] = useState(null); // 'image' | 'post' | 'comment' | null
  const [pendingCommentId, setPendingCommentId] = useState(null);

  const [isConfirmDeleting, setIsConfirmDeleting] = useState(false);

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

  /** ✅ 이미지/게시글 삭제 타입 선택 */
  const openDeleteTypePicker = useCallback(() => {
    if (vm.isImageFullScreen) return;

    Alert.alert(
      '삭제',
      '무엇을 삭제할까요?',
      [
        {
          text: '이 이미지 삭제',
          style: 'destructive',
          onPress: () => {
            setPendingDeleteType('image');
            setPendingCommentId(null);
            setConfirmVisible(true);
          },
        },
        {
          text: '게시글 삭제',
          style: 'destructive',
          onPress: () => {
            setPendingDeleteType('post');
            setPendingCommentId(null);
            setConfirmVisible(true);
          },
        },
        {text: '취소', style: 'cancel'},
      ],
      {cancelable: true},
    );
  }, [vm.isImageFullScreen]);

  /** ✅ 댓글 삭제 모달 열기 (BottomSheet에서 호출) */
  const openDeleteCommentConfirm = useCallback(commentId => {
    setPendingDeleteType('comment');
    setPendingCommentId(commentId);
    setConfirmVisible(true);
  }, []);

  /** ✅ confirm 모달 닫기 */
  const closeConfirmModal = useCallback(() => {
    if (isConfirmDeleting) return;
    setConfirmVisible(false);
    setPendingDeleteType(null);
    setPendingCommentId(null);
  }, [isConfirmDeleting]);

  /** ✅ confirm 모달 확인 -> 실제 삭제 실행 */
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
          // ✅ 네 thunk 시그니처: (commentId, postId)
          await dispatch(deleteCommentThunk(pendingCommentId, postId));
          vm.setToastMessage?.('댓글을 삭제했어요');
          vm.setToastVisible?.(true);
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
  ]);

  /** ---------------- header (✅ 투명 헤더) ---------------- */
  useEffect(() => {
    const matched = categoryList.find(
      c => c.categoryId === safeMemory?.categoryId,
    );

    navigation.setOptions({
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
          onPress={openDeleteTypePicker}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <Image
            source={require('../../../assets/images/trash.png')}
            style={styles.headerIcon}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, categoryList, safeMemory, openDeleteTypePicker]);

  /** ---------------- description sheet ---------------- */
  const descSnapPoints = useMemo(() => ['20%', '30%'], []);

  const presentDescSheet = useCallback(() => {
    descSheetRef.current?.present?.();
  }, []);

  const applyDescIndex = useCallback(nextExpanded => {
    const nextIndex = nextExpanded ? 1 : 0;
    descSheetRef.current?.present?.();
    descSheetRef.current?.snapToIndex?.(nextIndex);
  }, []);

  const toggleDescByClick = useCallback(() => {
    if (vm.isImageFullScreen) return;
    setDescExpanded(prev => {
      const next = !prev;
      applyDescIndex(next);
      return next;
    });
  }, [applyDescIndex, vm.isImageFullScreen]);

  const collapseDesc = useCallback(() => {
    setDescExpanded(false);
    applyDescIndex(false);
  }, [applyDescIndex]);

  useEffect(() => {
    presentDescSheet();
    requestAnimationFrame(() => applyDescIndex(false));
  }, [presentDescSheet, applyDescIndex]);

  useEffect(() => {
    if (vm.isImageFullScreen) collapseDesc();
  }, [vm.isImageFullScreen, collapseDesc]);

  /** ---------------- comment sheet ---------------- */
  const openCommentSheet = useCallback(() => {
    collapseDesc();
    setTimeout(() => commentSheetRef.current?.present?.(), 120);
  }, [collapseDesc]);

  const handleSwipeFromFirstToRight = useCallback(() => {
    if (vm.isImageFullScreen) return;
    dispatch(setMemorySelectedTab('post'));
    navigation.goBack();
  }, [dispatch, navigation, vm.isImageFullScreen]);

  if (!postFromStore) return <SafeAreaView style={{flex: 1}} />;

  const confirmTitle =
    pendingDeleteType === 'image'
      ? '이미지를 삭제할까요?'
      : pendingDeleteType === 'post'
      ? '게시글을 삭제할까요?'
      : '댓글을 삭제할까요?';

  const confirmMessage =
    pendingDeleteType === 'image'
      ? '삭제한 이미지는 복구할 수 없어요.'
      : pendingDeleteType === 'post'
      ? '게시글과 이미지가 모두 삭제되며 복구할 수 없어요.'
      : '삭제한 댓글은 복구할 수 없어요.';

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      {/* ✅ 통합 삭제 확인 모달(이미지/게시글/댓글) */}
      <ImageDeleteModal
        visible={confirmVisible}
        onClose={closeConfirmModal}
        onConfirm={confirmDelete}
        title={confirmTitle}
        subText={confirmMessage}
      />

      <View style={{flex: 1}}>
        <ImageCarousel
          localImages={vm.localImages}
          currentIndex={vm.currentImageIndex}
          setCurrentIndex={vm.setCurrentImageIndex}
          isFullScreen={vm.isImageFullScreen}
          setIsFullScreen={vm.setIsImageFullScreen}
          onSwipeFromFirstToRight={handleSwipeFromFirstToRight}
        />

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
      </View>

      {/* ---------------- 설명 BottomSheet ---------------- */}
      <BottomSheetModal
        ref={descSheetRef}
        snapPoints={descSnapPoints}
        handleIndicatorStyle={{backgroundColor: 'transparent'}}
        enableContentPanningGesture={false}
        enableHandlePanningGesture={false}
        enablePanDownToClose={false}
        onDismiss={() => {
          presentDescSheet();
          applyDescIndex(descExpanded);
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
        <Pressable onPress={toggleDescByClick} style={{flex: 1}}>
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

      {/* ---------------- 댓글 BottomSheet ---------------- */}
      {!vm.isImageFullScreen && (
        <MemoryDetailBottomSheet
          sheetRef={commentSheetRef}
          memory={safeMemory}
          commentList={vm.commentList}
          user={vm.user}
          familyUsers={vm.familyUsers}
          commentText={vm.commentText}
          onChangeComment={vm.setCommentText}

          /**
           * ✅ (중요) BottomSheet에서 onSubmitComment({content, mentionUserIds})로 호출함
           * vm.handleSendComment가 payload를 받게 맞춰야 함
           */
          onSubmitComment={vm.handleSendComment}

          // ✅ 여기서 "댓글 삭제 confirm"을 열어줌
          onDeleteComment={openDeleteCommentConfirm}
          snapPoints={['75%']}

          /**
           * ✅ (중요) 본인 제외 필터를 확실히 하기 위해 myUserId 전달
           * - 없으면 BottomSheet가 user.userId를 쓰지만,
           *   vm.user 로딩 타이밍 이슈나 타입 꼬임 방지용으로 명시 권장
           */
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

const modalTextStyles = StyleSheet.create({
  loading: {
    marginTop: getResponsiveHeight(10),
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'Pretendard-Medium',
    color: 'rgba(255,255,255,0.7)',
  },
});
