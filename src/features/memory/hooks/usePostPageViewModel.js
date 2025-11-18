// hooks/usePostPageViewModel.js
import {useState, useEffect, useMemo, useCallback} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';

import {
  fetchCommentsThunk,
  createCommentThunk,
  deleteCommentThunk,
} from '../store/commentThunk';
import {
  deletePostThunk,
  deletePostImageThunk,
} from '../store/memoryThunk';

export default function usePostPageViewModel(memory) {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const user = useSelector(state => state.user);
  const familyId = useSelector(state => state.family.familyId);
  const {commentList} = useSelector(state => state.comment);

  const safePostId = memory?.postId ?? null;
  const safeImages = useMemo(
    () => memory?.imageUrls ?? [],
    [memory?.imageUrls],
  );

  const [commentText, setCommentText] = useState('');
  const [commentIndex, setCommentIndex] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [localImages, setLocalImages] = useState(safeImages);

  const [isImageFullScreen, setIsImageFullScreen] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState('');
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);

  // ✅ 댓글 삭제 모달 상태 추가
  const [commentDeleteModalVisible, setCommentDeleteModalVisible] =
    useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);

  // ✅ 토스트 관련 상태
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // ✅ 메모리/이미지 변경 시 로컬 이미지 동기화
  useEffect(() => {
    setLocalImages(safeImages);
    setCurrentImageIndex(idx => {
      if (safeImages.length === 0) {return 0;}
      return Math.min(idx, safeImages.length - 1);
    });
  }, [safeImages]);

  // ✅ 댓글 목록 가져오기
  useEffect(() => {
    if (safePostId) {
      dispatch(fetchCommentsThunk(safePostId));
    }
  }, [dispatch, safePostId]);

  const handleSendComment = useCallback(() => {
    const text = commentText.trim();
    if (!text || !safePostId || !user?.userId) {return;}

    dispatch(
      createCommentThunk({
        postId: safePostId,
        content: text,
        authorId: user.userId,
      }),
    );
    setCommentText('');
    setToastMessage('댓글을 추가했어요');
    setToastVisible(true);
  }, [commentText, dispatch, safePostId, user?.userId]);

  const openDeleteCommentModal = useCallback(
    commentId => {
      setCommentToDelete(commentId);
      setCommentDeleteModalVisible(true);
    },
    [setCommentToDelete, setCommentDeleteModalVisible],
  );

  const [isDeleting, setIsDeleting] = useState(false);

const confirmDeleteComment = useCallback(async () => {
  if (!commentToDelete || !safePostId || isDeleting) {return;}
  setIsDeleting(true);
  try {
    await dispatch(deleteCommentThunk(commentToDelete, safePostId));
    setToastMessage('댓글을 삭제했어요');
    setToastVisible(true);
  } catch (e) {
    console.error('댓글 삭제 실패:', e);
  } finally {
    setCommentDeleteModalVisible(false);
    setCommentToDelete(null);
    setIsDeleting(false);
  }
}, [commentToDelete, safePostId, isDeleting, dispatch]);


  const handleDeletePost = useCallback(async () => {
    if (!safePostId || !familyId) {return;}
    try {
      await dispatch(deletePostThunk(safePostId, familyId));
      navigation.goBack();
      setToastMessage('게시글이 삭제되었어요');
      setToastVisible(true);
    } catch (error) {
      console.warn('게시글 삭제 실패:', error);
    }
  }, [dispatch, safePostId, familyId, navigation]);

  const handleDeleteImage = useCallback(async () => {
    if (!safePostId || !familyId || localImages.length === 0) {return;}

    const targetImage = localImages[currentImageIndex];
    try {
      await dispatch(deletePostImageThunk(safePostId, targetImage, familyId));

      const updated = localImages.filter((_, i) => i !== currentImageIndex);
      setLocalImages(updated);

      if (updated.length === 0) {
        await handleDeletePost();
      } else {
        setCurrentImageIndex(idx =>
          idx >= updated.length ? Math.max(0, updated.length - 1) : idx,
        );
        setToastMessage('이미지가 삭제되었어요');
        setToastVisible(true);
      }
    } catch (e) {
      console.warn('이미지 삭제 실패:', e);
    }
  }, [
    dispatch,
    safePostId,
    familyId,
    localImages,
    currentImageIndex,
    handleDeletePost,
  ]);

  return {
    user,
    commentList,
    commentText,
    setCommentText,
    commentIndex,
    setCommentIndex,
    currentImageIndex,
    setCurrentImageIndex,
    localImages,
    setLocalImages,
    isImageFullScreen,
    setIsImageFullScreen,
    deleteModalVisible,
    setDeleteModalVisible,
    deleteTarget,
    setDeleteTarget,
    showDeleteOptions,
    setShowDeleteOptions,
    handleSendComment,
    handleDeletePost,
    handleDeleteImage,
    commentDeleteModalVisible,
    setCommentDeleteModalVisible,
    commentToDelete,
    openDeleteCommentModal,
    confirmDeleteComment,
    // ✅ 토스트 상태 반환
    toastVisible,
    setToastVisible,
    toastMessage,
    setToastMessage,
  };
}
