/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/no-unstable-nested-components */
// PostPage.jsx
import React, {useEffect, useRef, useMemo, useState} from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Keyboard,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {fetchPostByIdThunk} from '../store/memoryThunk';

import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../../utils/responsive';
import useHideTabBar from '../../../hooks/useHideTabBar';
import ImageDeleteModal from '../components/DeleteOptionModal';
import CommentSection from '../components/CommentSection';
import DescriptionSection from '../components/DescriptionSection';
import usePostPageViewModel from '../hooks/usePostPageViewModel';
import {useDispatch, useSelector} from 'react-redux';
import ImageCarousel from '../components/ImageCarousel';
import ToastModal from '../../../components/ToastModal';
import CustomModal from '../../../components/CustomModal';
import {HEADER_STYLES} from 'styles/style';

export default function PostPage({route}) {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const didInitIndexRef = useRef(false);

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

  // 🔥 키보드 높이 상태
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!memory && postId) {
      dispatch(fetchPostByIdThunk(postId));
    }
  }, [postId, memory, dispatch]);

  useEffect(() => {
    if (didInitIndexRef.current) return;
    if (imageIndex != null) {
      vm.setCurrentImageIndex(imageIndex);
    }
    didInitIndexRef.current = true;
  }, [imageIndex, vm.setCurrentImageIndex]); // ✅ vm 말고 setter만

  useHideTabBar();

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

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showCommentSection, setShowCommentSection] = useState(false);

  useEffect(() => {
    if (vm.commentIndex) {
      setTimeout(() => {
        setShowCommentSection(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start();
      }, 100);
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setShowCommentSection(false));
    }
  }, [fadeAnim, vm.commentIndex]);

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

  // 🔥 키보드 이벤트로 댓글 시트 전체를 keyboardHeight만큼 올리기
  useEffect(() => {
    const showEvt =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvt, e => {
      setKeyboardHeight(e.endCoordinates?.height || 0);
    });

    const hideSub = Keyboard.addListener(hideEvt, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  if (!memory) {
    return <SafeAreaView style={styles.container} />;
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      {/* 상단 이미지 캐러셀 */}
      {vm.localImages?.length > 0 && (
        <View style={{flex: 1}}>
          <ImageCarousel
            commentCount={memory.commentCount}
            // ✅ 기존 localImages -> localMedia로 바꿔서 전달
            localMedia={vm.localImages.map(uri => ({
              uri,
              type: /\.mp4(\?|$)/i.test(String(uri)) ? 'video' : 'image',
            }))}
            currentIndex={vm.currentImageIndex}
            setCurrentIndex={vm.setCurrentImageIndex}
            setCommentIndex={vm.setCommentIndex}
            onMediaPress={() => vm.setIsImageFullScreen(true)}
            isCommentMode={vm.commentIndex}
            isFullScreen={vm.isImageFullScreen}
            setIsFullScreen={vm.setIsImageFullScreen}
          />
        </View>
      )}

      {/* 설명 섹션 (댓글 모드 / 풀스크린 아닐 때만) */}
      {!vm.commentIndex && !vm.isImageFullScreen && (
        <View style={styles.descriptionWrapper}>
          <DescriptionSection
            memory={memory}
            onPressComment={() => vm.setCommentIndex(true)}
          />
        </View>
      )}

      {/* 댓글 섹션 — absolute + bottom: keyboardHeight */}
      {showCommentSection && !vm.isImageFullScreen && (
        <Animated.View
          style={[
            styles.commentWrapper,
            {
              bottom: keyboardHeight, // 🔥 키보드 높이만큼 전체 시트 위로
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}>
          <CommentSection
            commentList={vm.commentList}
            commentText={vm.commentText}
            onChangeComment={vm.setCommentText}
            onSubmitComment={vm.handleSendComment}
            user={vm.user}
            onDeleteComment={commentId => vm.openDeleteCommentModal(commentId)}
          />
        </Animated.View>
      )}

      {/* 댓글 삭제 모달 */}
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

      {/* 게시물/사진 삭제 모달 */}
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

      {/* 삭제 옵션 드롭다운 */}
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

      {/* 토스트 */}
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
  container: {flex: 1, backgroundColor: '#F9F9F9'},
  headerTitle: {
    fontSize: HEADER_STYLES.defaultTitleFontSize,
    fontFamily: HEADER_STYLES.defaultTitleFontFamily,
    color: HEADER_STYLES.defaultTitleFontColor,
    lineHeight: getResponsiveHeight(26),
    textAlign: 'center',
  },
  descriptionWrapper: {
    width: '100%',
    height: Platform.OS === 'ios' ? '22%' : '24%',
    zIndex: 1,
  },
  commentWrapper: {
    position: 'absolute',
    bottom: 0, // 기본값, 위에서 bottom: keyboardHeight로 덮어씀
    width: '100%',
    height: Platform.OS === 'android' ? '56.5%' : '59%',
    backgroundColor: '#F9F9F9',
    zIndex: 2,
  },
  deleteOptions: {
    position: 'absolute',
    top: getResponsiveHeight(10),
    right: getResponsiveWidth(20),
    backgroundColor: 'rgba(220,220,220,0.86)',
    borderRadius: 7,
    zIndex: 11,
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
