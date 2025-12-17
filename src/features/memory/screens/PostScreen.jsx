/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/no-unstable-nested-components */
// src/screens/memory/PostPage.jsx

import React, {useEffect, useRef, useMemo} from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Dimensions,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useDispatch, useSelector} from 'react-redux';

import {fetchPostByIdThunk} from '../store/memoryThunk';
import useHideTabBar from '../../../hooks/useHideTabBar';

import ImageDeleteModal from '../components/DeleteOptionModal';
import usePostPageViewModel from '../hooks/usePostPageViewModel';
import ImageCarousel from '../components/ImageCarousel';
import ToastModal from '../../../components/ToastModal';
import CustomModal from '../../../components/CustomModal';

import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../../utils/responsive';
import {HEADER_STYLES} from 'styles/style';

import MemoryDetailBottomSheet from '../components/MemoryDetailBottomSheet';

const {height: SCREEN_HEIGHT} = Dimensions.get('window');

export default function PostPage({route}) {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const didInitIndexRef = useRef(false);

  const detailSheetRef = useRef(null);

  const {
    memory: preloadedPost,
    postId: paramPostId,
    imageIndex = 0,
  } = route.params || {};

  const postId = useMemo(
    () => preloadedPost?.postId ?? paramPostId,
    [preloadedPost, paramPostId],
  );

  const postFromStore = useSelector(state =>
    postId ? state.memory?.postsById?.[postId] : null,
  );
  const memory = preloadedPost || postFromStore;

  const categoryList = useSelector(state => state.category.categoryList);

  const safeMemory = useMemo(
    () => ({
      postId: postId ?? null,
      categoryId: null,
      title: '',
      content: '',
      imageUrls: [],
      commentCount: 0,
      createdAt: null,
      ...(memory || {}),
    }),
    [memory, postId],
  );

  const vm = usePostPageViewModel(safeMemory);

  useHideTabBar();

  // ✅ 게시글 데이터 없으면 fetch
  useEffect(() => {
    if (!memory && postId) {
      dispatch(fetchPostByIdThunk(postId));
    }
  }, [postId, memory, dispatch]);

  // ✅ 초기 이미지 인덱스 세팅
  useEffect(() => {
    if (didInitIndexRef.current) return;
    if (imageIndex != null) {
      vm.setCurrentImageIndex(imageIndex);
    }
    didInitIndexRef.current = true;
  }, [imageIndex, vm]);

  // ✅ 헤더 타이틀/삭제 버튼
  useEffect(() => {
    const matchedCategory = categoryList.find(
      cat => cat.categoryId === memory?.categoryId,
    );
    const categoryTitle = matchedCategory?.title || '게시물';

    navigation.setOptions({
      headerTitle: () => (
        <Text style={styles.headerTitle}>{categoryTitle}</Text>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => vm.setShowDeleteOptions(prev => !prev)}>
          <Image
            source={require('../../../assets/images/trash.png')}
            style={styles.headerIcon}
          />
        </TouchableOpacity>
      ),
    });
  }, [memory, categoryList, navigation, vm]);

  useEffect(() => {
    if (vm.isImageFullScreen) return; // 풀스크린이면 안 열기
    if (!detailSheetRef.current) return;

    // ✅ 모달 오픈
    detailSheetRef.current.present();
  }, [vm.isImageFullScreen]);

  useEffect(() => {
    if (vm.isImageFullScreen) {
      detailSheetRef.current?.dismiss();
    }
  }, [vm.isImageFullScreen]);

  // ✅ 삭제 옵션 드롭다운 애니메이션
  const deleteAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(deleteAnim, {
      toValue: vm.showDeleteOptions ? 1 : 0,
      duration: vm.showDeleteOptions ? 200 : 150,
      useNativeDriver: true,
    }).start();
  }, [deleteAnim, vm.showDeleteOptions]);

  const deleteOptionsStyle = {
    opacity: deleteAnim,
    transform: [
      {
        translateY: deleteAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-10, 0],
        }),
      },
      {
        scale: deleteAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.95, 1],
        }),
      },
    ],
  };

  if (!memory) {
    return <SafeAreaView style={styles.container} />;
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      {/* ✅ 상단 이미지 캐러셀 */}
      {vm.localImages?.length > 0 && (
        <View style={styles.carouselContainer}>
          <ImageCarousel
            localImages={vm.localImages}
            currentIndex={vm.currentImageIndex}
            setCurrentIndex={vm.setCurrentImageIndex}
            isFullScreen={vm.isImageFullScreen}
            setIsFullScreen={vm.setIsImageFullScreen}
          />
        </View>
      )}

      {/* ✅ 설명 + 댓글 통합 바텀시트 (풀스크린이면 숨김) */}
      {!vm.isImageFullScreen && (
        <MemoryDetailBottomSheet
          sheetRef={detailSheetRef}
          memory={memory}
          commentList={vm.commentList}
          user={vm.user}
          commentText={vm.commentText}
          onChangeComment={vm.setCommentText}
          onSubmitComment={vm.handleSendComment}
          onDeleteComment={commentId => vm.openDeleteCommentModal(commentId)}
          initialIndex={0}
          snapPoints={['15%', '85%']}
        />
      )}

      {/* ✅ 댓글 삭제 모달 */}
      {vm.commentDeleteModalVisible && (
        <CustomModal
          visible={vm.commentDeleteModalVisible}
          onClose={() => vm.setCommentDeleteModalVisible(false)}
          onConfirm={vm.confirmDeleteComment}
          title="댓글을 삭제할까요?"
          closeText="취소"
          confirmText="삭제"
          buttonBottomStyle={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: getResponsiveWidth(10),
          }}
        />
      )}

      {/* ✅ 게시물/사진 삭제 모달 */}
      {vm.deleteModalVisible && (
        <ImageDeleteModal
          visible={vm.deleteModalVisible}
          onClose={() => vm.setDeleteModalVisible(false)}
          onConfirm={async () => {
            vm.setDeleteModalVisible(false);
            try {
              if (vm.deleteTarget === '게시물') {
                await vm.handleDeletePost();
              } else {
                await vm.handleDeleteImage();
              }
            } catch (e) {
              console.error('삭제 실패:', e);
            }
          }}>
          <Text style={styles.modalTitle}>
            {vm.deleteTarget === '게시물'
              ? '게시물을 삭제할까요?'
              : '사진을 삭제할까요?'}
          </Text>
          <Text
            style={{
              fontSize: getResponsiveFontSize(14),
              color: 'gray',
              alignSelf: 'center',
              marginBottom: getResponsiveHeight(7),
            }}>
            삭제하면 다시 되돌릴 수 없어요
          </Text>
        </ImageDeleteModal>
      )}

      {/* ✅ 삭제 옵션 드롭다운 */}
      <Animated.View style={[styles.deleteOptions, deleteOptionsStyle]}>
        {['게시물', '사진'].map(option => (
          <TouchableOpacity
            key={option}
            style={styles.deleteOptionButton}
            onPress={() => {
              vm.setShowDeleteOptions(false);
              vm.setDeleteTarget(option);
              vm.setDeleteModalVisible(true);
            }}>
            <Text style={styles.deleteOptionText}>
              {option === '게시물' ? '게시물 전체 삭제' : '이 사진만 삭제'}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={styles.divider} />
      </Animated.View>

      {/* ✅ 토스트 */}
      <ToastModal
        visible={vm.toastVisible}
        message={vm.toastMessage}
        onClose={() => vm.setToastVisible(false)}
        duration={1500}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9F9F9', height: SCREEN_HEIGHT},

  headerTitle: {
    fontSize: HEADER_STYLES.defaultTitleFontSize,
    fontFamily: HEADER_STYLES.defaultTitleFontFamily,
    color: HEADER_STYLES.defaultTitleFontColor,
    lineHeight: getResponsiveHeight(26),
    textAlign: 'center',
  },

  carouselContainer: {
    flex: 1,
  },

  deleteOptions: {
    position: 'absolute',
    top: getResponsiveHeight(10),
    right: getResponsiveWidth(20),
    backgroundColor: 'rgba(220,220,220,0.86)',
    borderRadius: 7,
    zIndex: 50,
    paddingHorizontal: 5,
  },
  deleteOptionButton: {
    paddingVertical: getResponsiveHeight(9),
    paddingHorizontal: getResponsiveWidth(18),
  },
  deleteOptionText: {
    color: 'black',
    fontSize: getResponsiveFontSize(13),
    fontFamily: 'Pretendard-Light',
  },
  divider: {
    height: 1,
    bottom: '50%',
    backgroundColor: 'lightgray',
  },

  modalTitle: {
    color: 'black',
    fontSize:
      Platform.OS === 'android'
        ? getResponsiveFontSize(17)
        : getResponsiveFontSize(18),
    fontWeight: '700',
    fontFamily: 'Pretendard-SemiBold',
    textAlign: 'center',
    marginVertical: getResponsiveHeight(8),
  },

  headerIcon: {
    width: HEADER_STYLES.headerRightIconWidth,
    height: HEADER_STYLES.headerRightIconHeight,
    resizeMode: 'contain',
    marginRight: HEADER_STYLES.headerRightIconRightPadding,
  },
});
