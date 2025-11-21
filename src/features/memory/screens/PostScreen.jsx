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
import { HEADER_STYLES } from 'styles/style';

export default function PostPage({route}) {
  const dispatch = useDispatch();
  const navigation = useNavigation();

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

  useEffect(() => {
    if (!memory && postId) {
      dispatch(fetchPostByIdThunk(postId));
    }
  }, [postId, memory, dispatch]);

  useEffect(() => {
    if (imageIndex != null) {
      vm.setCurrentImageIndex(imageIndex);
    }
  }, [imageIndex, vm]);

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
          style={{marginRight: getResponsiveWidth(24)}}
          onPress={() => vm.setShowDeleteOptions(prev => !prev)}>
          <Image
            source={require('../../../assets/images/trash.png')}
            style={styles.headerIcon}
          />
        </TouchableOpacity>
      ),
    });
  }, [memory, categoryList, navigation, vm]);

  if (!memory) {
    return <SafeAreaView style={styles.container} />;
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      {vm.localImages?.length > 0 && (
        <View style={{flex: 1}}>
          <ImageCarousel
            commentCount={memory.commentCount}
            localImages={vm.localImages}
            currentImageIndex={vm.currentImageIndex}
            setCurrentImageIndex={vm.setCurrentImageIndex}
            setCommentIndex={vm.setCommentIndex}
            onImagePress={() => vm.setIsImageFullScreen(true)}
            isCommentMode={vm.commentIndex}
            isImageFullScreen={vm.isImageFullScreen}
            setIsImageFullScreen={vm.setIsImageFullScreen}
            initialIndex={imageIndex}
          />
        </View>
      )}

      {!vm.commentIndex && !vm.isImageFullScreen && (
        <View style={styles.descriptionWrapper}>
          <DescriptionSection
            memory={memory}
            onPressComment={() => vm.setCommentIndex(true)}
          />
        </View>
      )}

      {showCommentSection && !vm.isImageFullScreen && (
        <Animated.View
          style={[
            styles.commentWrapper,
            {
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
            onCloseComment={() => vm.setCommentIndex(false)}
            user={vm.user}
            onDeleteComment={commentId => vm.openDeleteCommentModal(commentId)}
          />
        </Animated.View>
      )}

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
    fontSize:
      Platform.OS === 'ios'
        ? getResponsiveFontSize(18) // 🔽 기존 20 → 18
        : getResponsiveFontSize(17), // 🔽 기존 18 → 17
    textAlign: 'center',
    fontFamily: 'Pretendard-Medium',
    fontWeight: '600',
    color: '#101010',
    lineHeight: getResponsiveHeight(26), // 🔽 살짝 줄임
  },
  descriptionWrapper: {
    width: '100%',
    height: Platform.OS === 'ios' ? '22%' : '24%',
    zIndex: 1,
  },
  commentWrapper: {
    position: 'absolute',
    bottom: 0,
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
    fontSize: getResponsiveFontSize(13), // 🔽 14 → 13
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
        ? getResponsiveFontSize(17) // 🔽 20 → 17
        : getResponsiveFontSize(18), // 🔽 22 → 18
    fontWeight: '700',
    fontFamily: 'Pretendard-SemiBold',
    textAlign: 'center',
    marginVertical: getResponsiveHeight(8),
  },
  headerIcon: {
    width: HEADER_STYLES.headerRightIconWidth,   // 🔽 28 → 24
    height: HEADER_STYLES.headerRightIconHeight, // 🔽 28 → 24
    resizeMode: 'contain',
  },
});
