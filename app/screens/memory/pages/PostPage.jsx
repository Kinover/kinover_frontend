import React, {useEffect, useRef, useMemo} from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {fetchPostByIdThunk} from '../../../redux/thunk/memoryThunk';
import {
  getResponsiveFontSize,
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../../utils/responsive';
import useHideTabBar from '../../../hooks/useHideTabBar';
import ImageDeleteModal from '../modules/post/deleteOptionModal';
import CommentSection from '../modules/post/components/commentSection';
import DescriptionSection from '../modules/post/components/descriptionSection';
import usePostPageViewModel from '../hooks/usePostPageViewModel';
import {useDispatch, useSelector} from 'react-redux';
import {deleteCommentThunk} from '../../../redux/thunk/commentThunk';
import ImageCarousel from '../modules/post/components/imageCarousel';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

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
    if (imageIndex != null) vm.setCurrentImageIndex(imageIndex);
  }, [imageIndex]);

  useHideTabBar();

  // 🔥 삭제 옵션 애니메이션
  const deleteAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (vm.showDeleteOptions) {
      Animated.timing(deleteAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(deleteAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [vm.showDeleteOptions]);

  const deleteOptionsStyle = {
    opacity: deleteAnim,
    transform: [
      {
        translateY: deleteAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-10, 0], // 위에서 내려오기
        }),
      },
      {
        scale: deleteAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.95, 1], // 작게 시작 → 커지기
        }),
      },
    ],
  };

  // 상단 헤더 구성
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
  }, [memory, categoryList]);

  const handleDeleteComment = commentId => {
    dispatch(deleteCommentThunk({commentId, postId}));
  };

  if (!memory) return <SafeAreaView style={styles.container} />;

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

      {vm.commentIndex && !vm.isImageFullScreen && (
        <View style={styles.commentWrapper}>
          <CommentSection
            commentList={vm.commentList}
            commentText={vm.commentText}
            onChangeComment={vm.setCommentText}
            onSubmitComment={vm.handleSendComment}
            onCloseComment={() => vm.setCommentIndex(false)}
            user={vm.user}
            onDeleteComment={handleDeleteComment}
          />
        </View>
      )}

      {vm.deleteModalVisible && (
        <ImageDeleteModal
          visible={vm.deleteModalVisible}
          onClose={() => vm.setDeleteModalVisible(false)}
          onConfirm={() =>
            vm.deleteTarget === '게시물'
              ? vm.handleDeletePost()
              : vm.handleDeleteImage()
          }>
          <Text style={styles.modalTitle}>
            {vm.deleteTarget === '게시물'
              ? '게시물을 삭제할까요?'
              : '사진을 삭제할까요?'}
          </Text>
          <Text
            style={{
              fontSize: getResponsiveFontSize(15),
              color: 'gray',
              alignSelf: 'center',
              marginBottom: getResponsiveHeight(7),
            }}>
            삭제하면 다시 되돌릴 수 없어요
          </Text>
        </ImageDeleteModal>
      )}

      {
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
      }
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F9F9F9'},
  headerTitle: {
    fontSize: Platform.OS==='ios'?getResponsiveFontSize(20):getResponsiveFontSize(18),
    textAlign: 'center',
    textAlignVertical: 'center',
    fontFamily: 'Pretendard-Regular',
    fontWeight:'semibold',
    color: '#101010',
    lineHeight:getResponsiveHeight(30),
  },
  descriptionWrapper: {
    position: 'relative',
    alignSelf: 'flex-end',
    width: '100%',
    height: Platform.OS==='ios'?'22%':'24%',
    zIndex: 1,
  },
  commentWrapper: {
    position: 'relative',
    alignSelf: 'flex-end',
    width: '100%',
    height: Platform.OS === 'android' ? '56.5%' : '56%',
    zIndex: 1,
  },
  deleteOptions: {
    position: 'absolute',
    top: getResponsiveHeight(10),
    right: getResponsiveWidth(20),
    backgroundColor: 'rgba(220, 220, 220, 0.86)',
    borderRadius: 7,
    zIndex: 11,
    paddingHorizontal:5,
  },
  deleteOptionButton: {
    paddingVertical: getResponsiveHeight(10),
    paddingHorizontal: getResponsiveWidth(20),
  },
  deleteOptionText: {
    color: 'black',
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Light',
    textAlign: 'center',
  },
  divider: {
    bottom: '50%',
    height: 0.5,
    backgroundColor: 'gray',
  },
  modalTitle: {
    color: 'black',
    fontSize:
      Platform.OS === 'android'
        ? getResponsiveFontSize(20)
        : getResponsiveFontSize(22),
    fontWeight: '700',
    fontFamily: 'Pretendard-SemiBold',
    textAlign: 'center',
    marginTop: getResponsiveHeight(10),
    marginBottom: getResponsiveHeight(10),
  },
  headerIcon: {
    width: getResponsiveWidth(25),
    height: getResponsiveHeight(25),
    resizeMode: 'contain',
  },
});
