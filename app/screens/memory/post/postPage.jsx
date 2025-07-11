// PostPage.tsx

import React, {useState, useEffect, useRef} from 'react';

import {
  Animated,
  FlatList,
  Image,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Platform,
  SafeAreaView,
  ImageBackground,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';

import getResponsiveFontSize, {
  getResponsiveHeight,
  getResponsiveIconSize,
  getResponsiveWidth,
} from '../../../utils/responsive';
import useHideTabBar from '../../../hooks/useHideTabBar';
import ImageDeleteModal from './imageDeleteModal';
import DescriptionSection from './descriptionSection';
import CommentSection from './commentSection';
import MemoryImageCarousel from './memoryImageCarousel';

import {
  deletePostThunk,
  deletePostImageThunk,
} from '../../../redux/thunk/memoryThunk';
import {
  fetchCommentsThunk,
  createCommentThunk,
} from '../../../redux/thunk/commentThunk';

export default function PostPage({route}) {
  const [commentIndex, setCommentIndex] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState('');
  const [commentText, setCommentText] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [localImages, setLocalImages] = useState([]);
  const SCREEN_WIDTH = Dimensions.get('window').width;

  const imageAnim = useRef(new Animated.Value(0)).current;
  const scrollX = useRef(new Animated.Value(0)).current;

  const navigation = useNavigation();
  const dispatch = useDispatch();

  const user = useSelector(state => state.user);
  const familyId = useSelector(state => state.family.familyId);
  const categoryList = useSelector(state => state.category.categoryList);
  const {commentList} = useSelector(state => state.comment);
  const memory = route.params.memory;

  useHideTabBar();

  useEffect(() => {
    if (memory?.postId) {
      dispatch(fetchCommentsThunk(memory.postId));
      setLocalImages(memory.imageUrls);
    }
  }, [memory]);

  useEffect(() => {
    const categoryTitle =
      categoryList.find(cat => cat.categoryId === memory.categoryId)?.title ||
      '';

    navigation.setOptions({
      headerTitle: () => (
        <Text
          style={{
            fontFamily: 'Pretendard-Regular',
            fontSize: getResponsiveFontSize(18),
            color: 'black',
          }}>
          {categoryTitle}
        </Text>
      ),
      headerRight: () => (
        <TouchableOpacity
          style={{marginRight: getResponsiveWidth(20)}}
          onPress={() => setShowDeleteOptions(prev => !prev)}>
          <Image
            source={require('../../../assets/images/trash.png')}
            style={{
              width: getResponsiveWidth(25),
              height: getResponsiveHeight(25),
              resizeMode: 'contain',
            }}
          />
        </TouchableOpacity>
      ),
    });
  }, [categoryList, memory.categoryId]);

  useEffect(() => {
    Animated.timing(imageAnim, {
      toValue: commentIndex ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [commentIndex]);

  const handleSendComment = () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    dispatch(
      createCommentThunk({
        postId: memory.postId,
        content: trimmed,
        authorId: user.userId,
      }),
    );
    setCommentText('');
  };

  const handleDeletePost = () => {
    navigation.goBack();
    setTimeout(() => {
      dispatch(deletePostThunk(memory.postId, familyId));
    }, 50);
  };

  const handleDeleteImage = async () => {
    const targetImage = localImages[currentImageIndex];
    try {
      await dispatch(
        deletePostImageThunk(memory.postId, targetImage, familyId),
      );
      const updated = localImages.filter((_, i) => i !== currentImageIndex);
      setLocalImages(updated);
      setCurrentImageIndex(prev =>
        prev >= updated.length ? updated.length - 1 : prev,
      );
      if (updated.length === 0) handleDeletePost();
    } catch (err) {
      console.error('❌ 이미지 삭제 실패:', err);
    }
  };

  const handleDeleteConfirm = () => {
    setDeleteModalVisible(false);
    deleteTarget === '게시물' ? handleDeletePost() : handleDeleteImage();
  };

  return (
    <SafeAreaView style={styles.container}>
      <MemoryImageCarousel
        localImages={localImages || []}
        imageAnim={imageAnim}
        scrollX={scrollX}
        currentImageIndex={currentImageIndex}
        setCurrentImageIndex={setCurrentImageIndex}
        setCommentIndex={setCommentIndex}
      />

      {!commentIndex ? (
        <View style={styles.descriptionWrapper}>
          <Image
            source={require('../../../assets/images/section.png')}
            resizeMode="contain"
            style={{
              position: 'absolute',
              width: SCREEN_WIDTH, // ➕ 넓게 (예: 좌우 여백 없애기)
              height: '100%',
              zIndex: 0,
            }}
          />
          <DescriptionSection
            memory={memory}
            commentList={commentList}
            onPressComment={() => setCommentIndex(true)}
          />
        </View>
      ) : (
        <View style={styles.commentWrapper}>
          <CommentSection
            commentList={commentList}
            commentText={commentText}
            onChangeComment={setCommentText}
            onSubmitComment={handleSendComment}
            onCloseComment={() => setCommentIndex(false)}
            user={user}
          />
        </View>
      )}

      {deleteModalVisible && (
        <ImageDeleteModal
          visible={deleteModalVisible}
          onClose={() => setDeleteModalVisible(false)}
          onConfirm={handleDeleteConfirm}
          closeText="취소"
          confirmText="삭제"
          closeTextStyle={styles.modalText}
          confirmTextStyle={styles.modalText}
          closeButtonStyle={styles.modalCloseButton}
          confirmButtonStyle={styles.modalConfirmButton}>
          <Text style={styles.modalTitle}>
            {deleteTarget === '게시물'
              ? '게시물을 삭제하시겠습니까?'
              : '사진을 삭제하시겠습니까?'}
          </Text>
        </ImageDeleteModal>
      )}

      {showDeleteOptions && (
        <View style={styles.deleteOptions}>
          <TouchableOpacity
            style={styles.deleteOptionButton}
            onPress={() => {
              setShowDeleteOptions(false);
              setDeleteTarget('게시물');
              setDeleteModalVisible(true);
            }}>
            <Text style={styles.deleteOptionText}>게시물 전체 삭제</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.deleteOptionButton}
            onPress={() => {
              setShowDeleteOptions(false);
              setDeleteTarget('사진');
              setDeleteModalVisible(true);
            }}>
            <Text style={styles.deleteOptionText}>이 사진만 삭제</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const SCREEN_WIDTH = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  descriptionWrapper: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    minHeight: '28%',

    zIndex: 10,
  },
  commentWrapper: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '50%',
    zIndex: 10,
  },
  deleteOptions: {
    position: 'absolute',
    top: getResponsiveHeight(95),
    right: getResponsiveWidth(15),
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
    borderRadius: 7,
    zIndex: 10,
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
    height: Platform.OS === 'android' ? 0.5 : 0.2,
    backgroundColor: 'gray',
  },
  modalText: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Regular',
  },
  modalTitle: {
    fontSize: getResponsiveFontSize(17),
    fontFamily: 'Pretendard-SemiBold',
    textAlign: 'center',
    marginTop: getResponsiveHeight(10),
    marginBottom: getResponsiveHeight(5),
  },
  modalCloseButton: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    paddingVertical: getResponsiveHeight(10),
    borderRadius: 8,
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#FFC84D',
    paddingVertical: getResponsiveHeight(10),
    borderRadius: 8,
  },
});
